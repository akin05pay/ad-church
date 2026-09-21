import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";

export const metadata: Metadata = {
  title: "Harpa Cristã",
  description: "Harpa Cristã no AD Church: catálogo público, busca por número e acompanhamento do culto.",
};

const highlights = [
  ["1", "Chuvas de Graça"],
  ["24", "Poder Pentecostal"],
  ["39", "Alvo Mais Que a Neve"],
  ["187", "Mais Perto, Meu Deus, de Ti"],
  ["291", "A Mensagem da Cruz"],
  ["301", "Vem Cear"],
  ["491", "Há Poder no Sangue de Jesus"],
  ["524", "Cristo Pensa em Mim"],
];

export default function HymnalPage() {
  return (
    <main>
      <PublicNav />

      <section className="hymnalHero">
        <div className="shell hymnalHeroInner">
          <div>
            <div className="eyebrow">HARPA CRISTÃ · ACESSO PÚBLICO</div>
            <h1>Louvor na palma da mão.</h1>
            <p>
              O hinário oficial das Assembleias de Deus, organizado para encontrar rapidamente
              um hino pelo número ou título e acompanhar o culto pelo celular.
            </p>

            <div className="hymnalSearchPreview" aria-label="Prévia da busca da Harpa">
              <span>⌕</span>
              <div>
                <small>BUSCAR HINO</small>
                <strong>Número ou título</strong>
              </div>
              <button type="button">Buscar</button>
            </div>

            <div className="hymnalMetaLine">
              <span><strong>524</strong> hinos catalogados</span>
              <span><strong>Sem login</strong> para consulta</span>
              <span><strong>Realtime</strong> no Modo Culto</span>
            </div>
          </div>

          <div className="hymnalCoverMock" aria-hidden="true">
            <div className="hymnalCoverCross">✦</div>
            <span>HARPA</span>
            <strong>CRISTÃ</strong>
            <small>AD Church · edição digital</small>
          </div>
        </div>
      </section>

      <section className="shell hymnalContent">
        <div className="homeSectionIntro">
          <div>
            <span className="homeSectionEyebrow">CATÁLOGO RECEBIDO</span>
            <h2>524 hinos, preparados para uma navegação simples.</h2>
          </div>
          <p>
            O PDF fornecido pela contratante já está sendo usado como referência de estrutura e
            indexação. A ingestão das letras será tratada como conteúdo licenciado da organização.
          </p>
        </div>

        <div className="hymnalHighlights">
          {highlights.map(([number, title]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <small>HARPA CRISTÃ</small>
                <strong>{title}</strong>
              </div>
              <i>→</i>
            </article>
          ))}
        </div>

        <div className="hymnalFeatureGrid">
          <article>
            <strong>Busca instantânea</strong>
            <span>Número e título com teclado e campos pensados para uso rápido durante o culto.</span>
          </article>
          <article>
            <strong>Modo culto</strong>
            <span>O hino selecionado pelo operador poderá aparecer simultaneamente em todos os celulares.</span>
          </article>
          <article>
            <strong>Leitura confortável</strong>
            <span>Fonte ajustável, contraste alto, tela limpa e rolagem pensada para smartphones.</span>
          </article>
          <article>
            <strong>Offline</strong>
            <span>Conteúdo licenciado poderá permanecer no aparelho para templos com sinal instável.</span>
          </article>
        </div>

        <div className="rightsCard rightsCardLicensed">
          <div className="rightsBadge rightsBadgeLicensed">CONTEÚDO LICENCIADO PELA CONTRATANTE</div>
          <h2>Acervo oficial fornecido ao projeto</h2>
          <p>
            O AD Church registra a Harpa Cristã como acervo autorizado pela organização contratante.
            A publicação será vinculada à edição e à fonte documental fornecida, preservando rastreabilidade.
          </p>
        </div>
      </section>
    </main>
  );
}
