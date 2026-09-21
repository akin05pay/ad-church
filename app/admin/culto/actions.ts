"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findBibleBook } from "@/lib/bible/catalog";

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function intField(formData: FormData, key: string) {
  const raw = textField(formData, key);
  const value = Number(raw);
  return Number.isInteger(value) ? value : NaN;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);
}

function withMessage(sessionId: string | null, kind: "ok" | "error", message: string) {
  const query = new URLSearchParams();
  if (sessionId) query.set("session", sessionId);
  query.set(kind, message);
  return `/admin/culto?${query.toString()}`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/culto");
  return { supabase, userId };
}

async function nextSequence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
) {
  const { data } = await supabase
    .from("worship_items")
    .select("sequence")
    .eq("worship_session_id", sessionId)
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sequence ?? 0) + 1;
}

function revalidateWorship(publicSlug?: string | null) {
  revalidatePath("/admin/culto");
  revalidatePath("/culto");
  if (publicSlug) revalidatePath(`/culto/${publicSlug}`);
}

async function sessionSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
) {
  const { data } = await supabase
    .from("worship_sessions")
    .select("public_slug")
    .eq("id", sessionId)
    .maybeSingle();
  return data?.public_slug ?? null;
}

export async function createWorshipSession(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const unitId = textField(formData, "unit_id");
  const title = textField(formData, "title") || "Culto";
  if (!unitId) redirect(withMessage(null, "error", "Selecione uma congregação."));

  const publicSlug = `${slugify(title) || "culto"}-${crypto.randomUUID().slice(0, 7)}`;

  const { data, error } = await supabase
    .from("worship_sessions")
    .insert({
      unit_id: unitId,
      title,
      starts_at: new Date().toISOString(),
      public_slug: publicSlug,
      status: "scheduled",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) redirect(withMessage(null, "error", error.message));

  revalidateWorship(publicSlug);
  redirect(withMessage(data.id, "ok", "Sessão criada."));
}

export async function startWorshipSession(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = textField(formData, "session_id");

  const { data: target, error: targetError } = await supabase
    .from("worship_sessions")
    .select("id,unit_id,public_slug")
    .eq("id", sessionId)
    .single();

  if (targetError) redirect(withMessage(sessionId, "error", targetError.message));

  await supabase
    .from("worship_sessions")
    .update({ status: "ended", ends_at: new Date().toISOString() })
    .eq("unit_id", target.unit_id)
    .eq("status", "live")
    .neq("id", sessionId);

  const { error } = await supabase
    .from("worship_sessions")
    .update({ status: "live", starts_at: new Date().toISOString(), ends_at: null })
    .eq("id", sessionId);

  if (error) redirect(withMessage(sessionId, "error", error.message));

  revalidateWorship(target.public_slug);
  redirect(withMessage(sessionId, "ok", "Culto publicado ao vivo."));
}

export async function endWorshipSession(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = textField(formData, "session_id");
  const publicSlug = await sessionSlug(supabase, sessionId);

  const { error } = await supabase
    .from("worship_sessions")
    .update({ status: "ended", ends_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) redirect(withMessage(sessionId, "error", error.message));

  revalidateWorship(publicSlug);
  redirect(withMessage(sessionId, "ok", "Culto encerrado."));
}

export async function publishScripture(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = textField(formData, "session_id");
  const rawBook = textField(formData, "book");
  const chapter = intField(formData, "chapter");
  const verseStart = intField(formData, "verse_start");
  const verseEndRaw = textField(formData, "verse_end");
  const verseEnd = verseEndRaw ? Number(verseEndRaw) : verseStart;
  const book = findBibleBook(rawBook);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    redirect(withMessage(sessionId, "error", "Livro ou capítulo inválido."));
  }
  if (!Number.isInteger(verseStart) || verseStart < 1 || !Number.isInteger(verseEnd) || verseEnd < verseStart) {
    redirect(withMessage(sessionId, "error", "Informe um intervalo de versículos válido."));
  }

  const { data: source, error: sourceError } = await supabase
    .from("bible_sources")
    .select("id")
    .eq("abbreviation", "BPM")
    .eq("active", true)
    .single();

  if (sourceError) redirect(withMessage(sessionId, "error", "Fonte bíblica BPM indisponível."));

  const externalReference = `/biblia/${book.slug}/${chapter}?v=${verseStart}`;
  const { data: passage, error: passageError } = await supabase
    .from("scripture_passages")
    .insert({
      bible_source_id: source.id,
      book: book.name,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      external_reference: externalReference,
      is_public: true,
    })
    .select("id")
    .single();

  if (passageError) redirect(withMessage(sessionId, "error", passageError.message));

  const { error: clearError } = await supabase
    .from("worship_items")
    .update({ is_current: false })
    .eq("worship_session_id", sessionId)
    .eq("item_type", "scripture")
    .eq("is_current", true);

  if (clearError) redirect(withMessage(sessionId, "error", clearError.message));

  const sequence = await nextSequence(supabase, sessionId);
  const label = `${book.name} ${chapter}:${verseStart}${verseEnd !== verseStart ? `-${verseEnd}` : ""}`;

  const { error } = await supabase.from("worship_items").insert({
    worship_session_id: sessionId,
    item_type: "scripture",
    scripture_passage_id: passage.id,
    label,
    sequence,
    is_current: true,
  });

  if (error) redirect(withMessage(sessionId, "error", error.message));

  const publicSlug = await sessionSlug(supabase, sessionId);
  revalidateWorship(publicSlug);
  redirect(withMessage(sessionId, "ok", `${label} publicado.`));
}

export async function publishHymn(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = textField(formData, "session_id");
  const hymnNumber = intField(formData, "hymn_number");
  const titleInput = textField(formData, "hymn_title");

  if (!Number.isInteger(hymnNumber) || hymnNumber < 1) {
    redirect(withMessage(sessionId, "error", "Informe um número de hino válido."));
  }

  const { data: hymnal, error: hymnalError } = await supabase
    .from("hymnals")
    .select("id")
    .eq("name", "Harpa Cristã")
    .eq("active", true)
    .single();

  if (hymnalError) redirect(withMessage(sessionId, "error", "Harpa Cristã indisponível."));

  let { data: hymn } = await supabase
    .from("hymns")
    .select("id,title")
    .eq("hymnal_id", hymnal.id)
    .eq("hymn_number", hymnNumber)
    .maybeSingle();

  if (!hymn) {
    if (!titleInput) {
      redirect(withMessage(sessionId, "error", "Este hino ainda não está no catálogo. Informe também o título."));
    }

    const { data: created, error: createError } = await supabase
      .from("hymns")
      .insert({
        hymnal_id: hymnal.id,
        hymn_number: hymnNumber,
        title: titleInput,
        external_reference: `/hinarios?numero=${hymnNumber}`,
        is_public: true,
      })
      .select("id,title")
      .single();

    if (createError) redirect(withMessage(sessionId, "error", createError.message));
    hymn = created;
  } else if (titleInput && titleInput !== hymn.title) {
    const { data: updated, error: updateError } = await supabase
      .from("hymns")
      .update({ title: titleInput, is_public: true })
      .eq("id", hymn.id)
      .select("id,title")
      .single();

    if (updateError) redirect(withMessage(sessionId, "error", updateError.message));
    hymn = updated;
  }

  const { error: clearError } = await supabase
    .from("worship_items")
    .update({ is_current: false })
    .eq("worship_session_id", sessionId)
    .eq("item_type", "hymn")
    .eq("is_current", true);

  if (clearError) redirect(withMessage(sessionId, "error", clearError.message));

  const sequence = await nextSequence(supabase, sessionId);
  const { error } = await supabase.from("worship_items").insert({
    worship_session_id: sessionId,
    item_type: "hymn",
    hymn_id: hymn.id,
    label: `Harpa Cristã ${hymnNumber}`,
    sequence,
    is_current: true,
  });

  if (error) redirect(withMessage(sessionId, "error", error.message));

  const publicSlug = await sessionSlug(supabase, sessionId);
  revalidateWorship(publicSlug);
  redirect(withMessage(sessionId, "ok", `Hino ${hymnNumber} publicado.`));
}

export async function publishNotice(formData: FormData) {
  const { supabase } = await requireUser();
  const sessionId = textField(formData, "session_id");
  const notice = textField(formData, "notice");
  if (!notice) redirect(withMessage(sessionId, "error", "Digite o aviso."));

  const { error: clearError } = await supabase
    .from("worship_items")
    .update({ is_current: false })
    .eq("worship_session_id", sessionId)
    .eq("item_type", "notice")
    .eq("is_current", true);

  if (clearError) redirect(withMessage(sessionId, "error", clearError.message));

  const sequence = await nextSequence(supabase, sessionId);
  const { error } = await supabase.from("worship_items").insert({
    worship_session_id: sessionId,
    item_type: "notice",
    label: notice,
    sequence,
    is_current: true,
  });

  if (error) redirect(withMessage(sessionId, "error", error.message));

  const publicSlug = await sessionSlug(supabase, sessionId);
  revalidateWorship(publicSlug);
  redirect(withMessage(sessionId, "ok", "Aviso publicado."));
}
