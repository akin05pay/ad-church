"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export function WorshipLive() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<WorshipSession | null>(null);
  const [items, setItems] = useState<WorshipItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: liveSession } = await supabase
      .from("worship_sessions")
      .select("id,title,public_slug,starts_at")
      .eq("status", "live")
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
  }, [supabase]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("public-worship-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "worship_sessions" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "worship_items" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const scripture = items.find((item) => item.item_type === "scripture") ?? null;
  const hymn = items.find((item) => item.item_type === "hymn") ?? null;

  if (loading) {
    return <div className="notice"><strong>Conectando ao culto…</strong><span>Buscando a sessão pública ativa.</span></div>;
  }

  if (!session) {
    return (
      <div className="notice">
        <strong>Nenhum culto está sendo transmitido pelo modo acompanhamento agora.</strong>
        <span>Você ainda pode abrir a Bíblia ou os hinários sem login.</span>
      </div>
    );
  }

  return (
    <>
      <div className="notice">
        <strong>{session.title}</strong>
        <span>Atualizações desta tela chegam automaticamente enquanto o culto estiver ao vivo.</span>
      </div>

      <div className="worshipGrid">
        <article className="worshipCard">
          <span className="cardLabel">LEITURA ATUAL</span>
          {scripture?.scripture_passages ? (
            <>
              <h2>
                {scripture.scripture_passages.book} {scripture.scripture_passages.chapter}
                {scripture.scripture_passages.verse_start ? `:${scripture.scripture_passages.verse_start}` : ""}
                {scripture.scripture_passages.verse_end && scripture.scripture_passages.verse_end !== scripture.scripture_passages.verse_start
                  ? `–${scripture.scripture_passages.verse_end}`
                  : ""}
              </h2>
              {scripture.scripture_passages.content_text && <p>{scripture.scripture_passages.content_text}</p>}
            </>
          ) : (
            <><h2>Aguardando referência</h2><p>O operador ainda não definiu uma passagem atual.</p></>
          )}
          <Link href="/biblia">Abrir leitor bíblico →</Link>
        </article>

        <article className="worshipCard">
          <span className="cardLabel">HINO ATUAL</span>
          {hymn?.hymns ? (
            <>
              <h2>{hymn.hymns.hymn_number ? `${hymn.hymns.hymn_number} · ` : ""}{hymn.hymns.title}</h2>
              {hymn.hymns.lyrics_text && <p>{hymn.hymns.lyrics_text}</p>}
            </>
          ) : (
            <><h2>Aguardando hino</h2><p>O operador ainda não definiu um hino atual.</p></>
          )}
          <Link href="/hinarios">Abrir hinários →</Link>
        </article>
      </div>
    </>
  );
}
