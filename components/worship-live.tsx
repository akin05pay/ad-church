"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";

type WorshipSession = {
  id: string;
  title: string;
  public_slug: string;
  starts_at: string;
};

type WorshipItem = {
  id: string;
  item_type: "scripture" | "hymn" | "notice";
  label: string | null;
  sequence: number;
  is_current: boolean;
  scripture_passages: null | {
    book: string;
    chapter: number;
    verse_start: number | null;
    verse_end: number | null;
    content_text: string | null;
    external_reference: string | null;
  };
  hymns: null | {
    hymn_number: number | null;
    title: string;
    lyrics_text: string | null;
    external_reference: string | null;
  };
};

export function WorshipLive({ slug }: { slug?: string }) {
  const configured = isSupabaseBrowserConfigured();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const [session, setSession] = useState<WorshipSession | null>(null);
  const [items, setItems] = useState<WorshipItem[]>([]);
  const [loading, setLoading] = useState(configured);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let sessionQuery = supabase
      .from("worship_sessions")
      .select("id,title,public_slug,starts_at")
      .eq("status", "live");

    if (slug) {
      sessionQuery = sessionQuery.eq("public_slug", slug);
    }

    const { data: liveSession } = await sessionQuery
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!liveSession) {
      setSession(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: liveItems } = await supabase
      .from("worship_items")
      .select(`
        id,item_type,label,sequence,is_current,
        scripture_passages(book,chapter,verse_start,verse_end,content_text,external_reference),
        hymns(hymn_number,title,lyrics_text,external_reference)
      `)
      .eq("worship_session_id", liveSession.id)
      .eq("is_current", true)
      .order("sequence", { ascending: true });

    setSession(liveSession as WorshipSession);
    setItems((liveItems ?? []) as unknown as WorshipItem[]);
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void load();

    const channel = supabase
      .channel(`public-worship-live:${slug ?? "latest"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "worship_sessions" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "worship_items" },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, slug, supabase]);

  const scripture = items.find((item) => item.item_type === "scripture") ?? null;
  const hymn = items.find((item) => item.item_type === "hymn") ?? null;
  const notice = items.find((item) => item.item_type === "notice") ?? null;

  if (!configured) {
    return (
      <div className="notice">
        <strong>Conexão temporariamente indisponível</strong>
        <span>A Bíblia e a Harpa continuam acessíveis pela navegação pública.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="notice">
        <strong>Conectando ao culto…</strong>
        <span>Buscando a sessão pública ativa.</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="notice">
        <strong>{slug ? "Este culto não está ao vivo agora." : "Nenhum culto está ao vivo agora."}</strong>
        <span>Você ainda pode abrir a Bíblia ou a Harpa sem login.</span>
      </div>
    );
  }

  const scriptureHref =
    scripture?.scripture_passages?.external_reference ?? "/biblia";
  const hymnHref = hymn?.hymns?.external_reference ?? "/hinarios";

  return (
    <>
      <div className="worshipLiveHeader">
        <div>
          <span className="livePill"><i /> AO VIVO</span>
          <h2>{session.title}</h2>
          <p>Atualizações desta tela chegam automaticamente.</p>
        </div>
        {!slug && (
          <Link className="worshipSpecificLink" href={`/culto/${session.public_slug}`}>
            Abrir link deste culto →
          </Link>
        )}
      </div>

      {notice?.label && (
        <div className="worshipNotice">
          <span>AVISO</span>
          <strong>{notice.label}</strong>
        </div>
      )}

      <div className="worshipGrid">
        <article className="worshipCard worshipCardPrimary">
          <span className="cardLabel">LEITURA ATUAL</span>
          {scripture?.scripture_passages ? (
            <>
              <h2>
                {scripture.scripture_passages.book} {scripture.scripture_passages.chapter}
                {scripture.scripture_passages.verse_start
                  ? `:${scripture.scripture_passages.verse_start}`
                  : ""}
                {scripture.scripture_passages.verse_end &&
                scripture.scripture_passages.verse_end !== scripture.scripture_passages.verse_start
                  ? `–${scripture.scripture_passages.verse_end}`
                  : ""}
              </h2>
              <p>Toque para abrir a passagem no leitor bíblico.</p>
            </>
          ) : (
            <>
              <h2>Aguardando referência</h2>
              <p>O operador ainda não definiu uma passagem atual.</p>
            </>
          )}
          <Link href={scriptureHref}>Abrir leitor bíblico →</Link>
        </article>

        <article className="worshipCard worshipCardHymn">
          <span className="cardLabel">HARPA CRISTÃ</span>
          {hymn?.hymns ? (
            <>
              <h2>
                {hymn.hymns.hymn_number ? `${hymn.hymns.hymn_number} · ` : ""}
                {hymn.hymns.title}
              </h2>
              <p>Toque para abrir o hinário e acompanhar o louvor.</p>
            </>
          ) : (
            <>
              <h2>Aguardando hino</h2>
              <p>O operador ainda não definiu um hino atual.</p>
            </>
          )}
          <Link href={hymnHref}>Abrir Harpa Cristã →</Link>
        </article>
      </div>
    </>
  );
}
