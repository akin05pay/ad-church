export type BibleVerse = {
  v: number | string;
  ve?: number | string;
  t: string;
  q?: number[];
  p?: boolean;
  b?: boolean;
  s?: string;
  ms?: string;
  d?: string;
};

export type BibleChapter = {
  translation: string;
  book: string;
  chapter: number;
  verses: BibleVerse[];
};

const BASE_URL = "https://free.bible/bible/pt";

export async function fetchBibleChapter(book: string, chapter: number): Promise<BibleChapter | null> {
  try {
    const response = await fetch(`${BASE_URL}/${book}/${chapter}.json`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as BibleChapter;
    if (!Array.isArray(data.verses)) return null;
    return data;
  } catch {
    return null;
  }
}
