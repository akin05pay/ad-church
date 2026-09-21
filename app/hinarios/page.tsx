import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";

export const metadata: Metadata = {
  title: "Hinários",
  description: "Área pública de hinários do AD Church.",
};

export default function HymnalPage() {
  return (
    <main>
      <PublicNav />
      <section className="shell section narrow hymnalLanding">
        <div className="eyebrow">HINÁRIOS · SEM LOGIN</div>
        <h1 className="pageTitle">Harpa Cristã</h1>
        <p className="lead">
          O hinário oficial das Assembleias de Deus terá uma experiência própria para busca por
          número, título e acompanhamento do culto.
        </p>

        <div className="rightsCard">
          <div className="rightsBadge">LICENÇA EM VALIDAÇÃO</div>
          <h2>Estrutura pronta, letras protegidas</h2>
          <p>
            A interface e o banco já estão preparados para a Harpa Cristã, mas as letras,
            partituras, cifras e áudios não serão copiados de sites de terceiros sem autorização
            comprovada da CPAD ou do titular de cada obra.
          </p>
        </div>

        <div className="hymnalFeatureGrid">
          <article>
            <strong>Busca instantânea</strong>
            <span>Número e título com teclado numérico amigável para celular.</span>
          </article>
          <article>
            <strong>Modo culto</strong>
            <span>O operador poderá publicar o hino atual para todos os aparelhos em Realtime.</span>
          </article>
          <article>
            <strong>Offline</strong>
            <span>Conteúdo autorizado poderá ser salvo no aparelho para uso sem sinal.</span>
          </article>
          <article>
            <strong>Acessibilidade</strong>
            <span>Fonte grande, contraste alto e controles dimensionados para toque.</span>
          </article>
        </div>

        <div className="notice">
          <strong>O que já pode funcionar sem a licença das letras?</strong>
          <span>
            Cadastro do hinário, controle de edição/direitos, seleção por referência no Modo Culto
            e toda a UI. O texto integral será ativado somente quando a permissão estiver documentada.
          </span>
        </div>
      </section>
    </main>
  );
}
