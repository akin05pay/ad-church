import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { BibleReferenceSearch } from "@/components/bible-reference-search";
import { BIBLE_BOOKS } from "@/lib/bible/catalog";

export const metadata: Metadata = {
  title: "Bíblia",
  description: "Bíblia pública para acompanhar cultos, ler por livro, capítulo e versículo.",
};

const oldTestament = BIBLE_BOOKS.filter((book) => book.testament === "old");
const newTestament = BIBLE_BOOKS.filter((book) => book.testament === "new");

function BookSection({ title, books }: { title: string; books: typeof BIBLE_BOOKS }) {
  return (
    <section className="bibleBookSection">
      <div className="sectionHeading">
        <h2>{title}</h2>
        <span>{books.length} livros</span>
      </div>
      <div className="bibleBookGrid">
        {books.map((book) => (
          <Link className="bibleBookCard" href={`/biblia/${book.slug}/1`} key={book.slug}>
            <span className="bookAbbr">{book.abbreviation}</span>
            <span>
              <strong>{book.name}</strong>
              <small>{book.chapters} {book.chapters === 1 ? "capítulo" : "capítulos"}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function BiblePage() {
  return (
    <main>
      <PublicNav />
      <section className="shell bibleLanding">
        <div className="eyebrow">BÍBLIA · SEM LOGIN</div>
        <h1 className="pageTitle">Leia. Encontre. Acompanhe.</h1>
        <p className="lead bibleLead">
          Abra uma referência em segundos durante o culto. A versão inicial é a Bíblia Portuguesa
          Mundial (BPM), em domínio público.
        </p>

        <BibleReferenceSearch />

        <div className="contentRightsStrip">
          <div><strong>BPM</strong><span>Ativa · domínio público</span></div>
          <div><strong>Bíblia Livre</strong><span>Aberta · CC BY 4.0 · integração futura</span></div>
          <div><strong>ARC</strong><span>Referência tradicional · licença necessária</span></div>
        </div>

        <BookSection books={oldTestament} title="Antigo Testamento" />
        <BookSection books={newTestament} title="Novo Testamento" />

        <p className="sourceFootnote">
          Cânon protestante: 66 livros e 1.189 capítulos. A BPM é carregada de fonte pública e pode
          permanecer disponível sem criar conta.
        </p>
      </section>
    </main>
  );
}
