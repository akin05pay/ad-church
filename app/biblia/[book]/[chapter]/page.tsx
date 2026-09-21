import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/public-nav";
import { BibleReader } from "@/components/bible-reader";
import { getAdjacentChapter, getBibleBook } from "@/lib/bible/catalog";
import { fetchBibleChapter } from "@/lib/bible/free-bible";

export const revalidate = 86400;

type Props = {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book: slug, chapter: chapterValue } = await params;
  const book = getBibleBook(slug);
  const chapter = Number(chapterValue);

  if (!book || !Number.isInteger(chapter)) return { title: "Bíblia" };

  return {
    title: `${book.name} ${chapter}`,
    description: `Leia ${book.name} ${chapter} na Bíblia Portuguesa Mundial.`,
  };
}

function href(book: string, chapter: number) {
  return `/biblia/${book}/${chapter}`;
}

export default async function BibleChapterPage({ params, searchParams }: Props) {
  const { book: slug, chapter: chapterValue } = await params;
  const query = await searchParams;
  const book = getBibleBook(slug);
  const chapter = Number(chapterValue);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  const data = await fetchBibleChapter(book.slug, chapter);
  const initialVerse = typeof query.v === "string" ? Number(query.v) : undefined;
  const previous = getAdjacentChapter(book.slug, chapter, -1);
  const next = getAdjacentChapter(book.slug, chapter, 1);

  return (
    <main>
      <PublicNav />
      <section className="readerPage">
        <div className="readerTopbar">
          <Link className="backToBooks" href="/biblia">← Livros</Link>

          <details className="chapterPicker">
            <summary>{book.name} {chapter}</summary>
            <div className="chapterPickerPanel">
              <strong>{book.name}</strong>
              <div className="chapterGrid">
                {Array.from({ length: book.chapters }, (_, index) => index + 1).map((number) => (
                  <Link
                    aria-current={number === chapter ? "page" : undefined}
                    href={href(book.slug, number)}
                    key={number}
                  >
                    {number}
                  </Link>
                ))}
              </div>
            </div>
          </details>

          <span className="translationBadge">BPM</span>
        </div>

        <header className="chapterHeader">
          <span>{book.testament === "old" ? "Antigo Testamento" : "Novo Testamento"}</span>
          <h1>{book.name} {chapter}</h1>
          <p>Bíblia Portuguesa Mundial · domínio público</p>
        </header>

        {data ? (
          <BibleReader
            bookName={book.name}
            chapter={chapter}
            initialVerse={Number.isFinite(initialVerse) ? initialVerse : undefined}
            verses={data.verses}
          />
        ) : (
          <div className="notice readerError">
            <strong>Não foi possível carregar este capítulo agora.</strong>
            <span>Se já o abriu antes neste aparelho, tente novamente sem conexão após recarregar.</span>
          </div>
        )}

        <nav className="chapterNav" aria-label="Navegação entre capítulos">
          {previous ? (
            <Link href={href(previous.book.slug, previous.chapter)}>
              <span>Anterior</span>
              <strong>{previous.book.name} {previous.chapter}</strong>
            </Link>
          ) : <span />}
          {next ? (
            <Link className="nextChapter" href={href(next.book.slug, next.chapter)}>
              <span>Próximo</span>
              <strong>{next.book.name} {next.chapter}</strong>
            </Link>
          ) : <span />}
        </nav>

        <footer className="readerLicense">
          Texto: Bíblia Portuguesa Mundial (BPM), domínio público. Fonte de distribuição:
          Free.Bible / eBible.org.
        </footer>
      </section>
    </main>
  );
}
