"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { findBibleBook } from "@/lib/bible/catalog";

export function BibleReferenceSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const match = value.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    if (!match) {
      setError("Digite uma referência como João 3, João 3:16 ou Salmos 23.");
      return;
    }

    const [, rawBook, rawChapter, rawVerse] = match;
    const book = findBibleBook(rawBook);
    const chapter = Number(rawChapter);

    if (!book || chapter < 1 || chapter > book.chapters) {
      setError("Livro ou capítulo não encontrado.");
      return;
    }

    const verse = rawVerse ? `?v=${Number(rawVerse)}` : "";
    router.push(`/biblia/${book.slug}/${chapter}${verse}`);
  }

  return (
    <form className="bibleSearch" onSubmit={submit}>
      <div className="bibleSearchRow">
        <input
          aria-label="Buscar referência bíblica"
          autoCapitalize="words"
          enterKeyHint="go"
          inputMode="text"
          onChange={(event) => setValue(event.target.value)}
          placeholder="João 3:16, Salmos 23..."
          value={value}
        />
        <button type="submit">Abrir</button>
      </div>
      {error && <p className="fieldError" role="alert">{error}</p>}
    </form>
  );
}
