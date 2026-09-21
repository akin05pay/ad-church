import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";

export const metadata: Metadata = { title: "Bíblia" };

const books = ["Gênesis", "Salmos", "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos"];

export default function BiblePage() {
  return (
    <main>
      <PublicNav />
      <section className="shell section narrow">
        <div className="eyebrow">ACESSO PÚBLICO</div>
        <h1 className="pageTitle">Bíblia</h1>
        <p className="muted">Nenhum login é necessário para leitura. O texto integral será integrado somente a partir de fonte autorizada/licenciada.</p>
        <div className="searchBox">
          <input aria-label="Buscar livro ou referência" placeholder="Buscar: João 3, Salmos 23..." />
          <button>Buscar</button>
        </div>
        <div className="bookGrid">
          {books.map((book) => <button key={book} className="bookButton">{book}</button>)}
        </div>
        <div className="readerPlaceholder">
          <strong>Leitor preparado para integração</strong>
          <span>Livro → capítulo → versículo → seleção → compartilhamento.</span>
          <small>Conteúdo bíblico não foi copiado para esta fundação enquanto a fonte e a licença não forem definidas.</small>
        </div>
      </section>
    </main>
  );
}
