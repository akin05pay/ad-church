"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { BibleVerse } from "@/lib/bible/free-bible";

type Props = {
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
  initialVerse?: number;
};

const MIN_SCALE = 0.9;
const MAX_SCALE = 1.45;
const STEP = 0.1;

export function BibleReader({ bookName, chapter, verses, initialVerse }: Props) {
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<number | string | null>(initialVerse ?? null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("adchurch:bible-font-scale");
    const parsed = stored ? Number(stored) : 1;
    if (Number.isFinite(parsed)) setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed)));
  }, []);

  useEffect(() => {
    if (initialVerse) {
      document.getElementById(`verse-${initialVerse}`)?.scrollIntoView({ block: "center" });
    }
  }, [initialVerse]);

  function changeScale(next: number) {
    const bounded = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(next.toFixed(2))));
    setScale(bounded);
    window.localStorage.setItem("adchurch:bible-font-scale", String(bounded));
  }

  const selectedVerse = useMemo(
    () => verses.find((verse) => String(verse.v) === String(selected)),
    [selected, verses],
  );

  const reference = selectedVerse
    ? `${bookName} ${chapter}:${selectedVerse.v}${selectedVerse.ve ? `–${selectedVerse.ve}` : ""}`
    : "";

  async function copyVerse() {
    if (!selectedVerse) return;
    await navigator.clipboard.writeText(`${selectedVerse.t}\n\n${reference} · BPM`);
    setFeedback("Versículo copiado");
    window.setTimeout(() => setFeedback(""), 1600);
  }

  async function shareVerse() {
    if (!selectedVerse) return;
    const text = `${selectedVerse.t}\n\n${reference} · BPM`;
    if (navigator.share) {
      await navigator.share({ title: reference, text });
      return;
    }
    await copyVerse();
  }

  const style = { "--reader-scale": scale } as CSSProperties;

  return (
    <div className="bibleReaderWrap">
      <div className="readerControls" aria-label="Controles de leitura">
        <div>
          <strong>Leitura</strong>
          <span>BPM · domínio público</span>
        </div>
        <div className="fontControls">
          <button
            aria-label="Diminuir tamanho da letra"
            disabled={scale <= MIN_SCALE}
            onClick={() => changeScale(scale - STEP)}
            type="button"
          >
            A−
          </button>
          <button
            aria-label="Aumentar tamanho da letra"
            disabled={scale >= MAX_SCALE}
            onClick={() => changeScale(scale + STEP)}
            type="button"
          >
            A+
          </button>
        </div>
      </div>

      <article className="bibleText" style={style}>
        {verses.map((verse) => {
          const active = String(selected) === String(verse.v);
          const poetry = verse.t.includes("\n");

          return (
            <div key={`${verse.v}-${verse.ve ?? ""}`}>
              {(verse.ms || verse.s || verse.d) && (
                <h2 className="scriptureHeading">{verse.ms || verse.s || verse.d}</h2>
              )}
              <button
                aria-pressed={active}
                className={`verseRow${active ? " selected" : ""}${poetry ? " poetry" : ""}`}
                id={`verse-${verse.v}`}
                onClick={() => setSelected(active ? null : verse.v)}
                type="button"
              >
                <sup>{verse.v}{verse.ve ? `–${verse.ve}` : ""}</sup>
                <span>{verse.t}</span>
              </button>
            </div>
          );
        })}
      </article>

      {selectedVerse && (
        <div className="verseActionBar" role="region" aria-label="Ações do versículo selecionado">
          <div>
            <strong>{reference}</strong>
            {feedback && <span aria-live="polite">{feedback}</span>}
          </div>
          <div>
            <button onClick={copyVerse} type="button">Copiar</button>
            <button onClick={shareVerse} type="button">Compartilhar</button>
            <button className="ghostButton" onClick={() => setSelected(null)} type="button">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
