import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";

export const metadata: Metadata = { title: "Hinários" };

const demo = [
  { number: "15", title: "Hino de demonstração" },
  { number: "291", title: "Hino de demonstração" },
  { number: "545", title: "Hino de demonstração" }
];

export default function HymnalPage() {
  return (
    <main>
      <PublicNav />
      <section className="shell section narrow">
        <div className="eyebrow">ACESSO PÚBLICO</div>
        <h1 className="pageTitle">Hinários</h1>
        <p className="muted">Busca pública por hinário, número e título. Letras, cifras, áudio e partituras entram somente quando houver autorização de uso.</p>
        <div className="searchBox">
          <input aria-label="Buscar hino" placeholder="Número ou título do hino" />
          <button>Buscar</button>
        </div>
        <div className="list">
          {demo.map((hymn) => (
            <article className="listItem" key={hymn.number}>
              <span className="numberBadge">{hymn.number}</span>
              <div><strong>{hymn.title}</strong><p>Conteúdo aguardando fonte/licença autorizada.</p></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
