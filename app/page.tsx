import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { HeroWorshipVideo } from "@/components/hero-worship-video";
import "./home-editorial.css";

const access = [
  {
    href: "/culto",
    index: "01",
    label: "Culto",
    title: "Acompanhe o que está acontecendo agora.",
    copy: "Leitura bíblica, Harpa e avisos enviados pela liderança em tempo real.",
  },
  {
    href: "/biblia",
    index: "02",
    label: "Palavra",
    title: "A Bíblia sempre aberta.",
    copy: "Busca rápida por livro, capítulo e versículo — sem login.",
  },
  {
    href: "/hinarios",
    index: "03",
    label: "Louvor",
    title: "A Harpa no celular.",
    copy: "Encontre o hino pelo número ou título e acompanhe a congregação.",
  },
  {
    href: "/online",
    index: "04",
    label: "Online",
    title: "Cultos, salas e encontros de onde você estiver.",
    copy: "YouTube, Zoom, Google Meet e outros encontros digitais no mesmo fluxo.",
  },
  {
    href: "/login",
    index: "05",
    label: "Comunidade",
    title: "A sua igreja, quando você entra.",
    copy: "Agenda, EBD, ministérios, avisos e vínculos da sua congregação.",
  },
];

export default function HomePage() {
  return (
    <main className="editorialHome">
      <PublicNav />

      <section className="editorialHero">
        <HeroWorshipVideo />

        <div className="editorialHeroShade" aria-hidden="true" />

        <div className="editorialHeroInner shell">
          <div className="editorialHeroTopline">
            <span>ASSEMBLEIA DE DEUS ONLINE · AD CHURCH</span>
            <span>SETOR 04 · SANTANA</span>
          </div>

          <div className="editorialHeroContent">
            <p className="editorialHeroEyebrow">IGREJA · PALAVRA · COMUNIDADE</p>
            <h1>
              A fé acompanha você.
              <span>Antes, durante e depois do culto.</span>
            </h1>
            <p className="editorialHeroText">
              Um braço de vida congregacional conectado à Assembleia de Deus Online:
              Bíblia, Harpa, culto, grupos, encontros digitais e a igreja local no mesmo caminho.
            </p>

            <div className="editorialHeroActions">
              <Link href="/culto" className="editorialPrimaryAction">
                Acompanhar o culto <span>→</span>
              </Link>
              <Link href="/online" className="editorialSecondaryAction">
                Entrar no Online
              </Link>
            </div>
          </div>

          <div className="editorialHeroFooter">
            <span>Ministério do Belém</span>
            <span>São Paulo</span>
            <span>Presencial + digital + vida congregacional</span>
          </div>
        </div>
      </section>

      <section className="editorialIntro shell">
        <div className="editorialIntroLabel">AD Church</div>
        <div className="editorialIntroBody">
          <h2>Uma igreja sem muros também precisa de uma vida congregacional conectada.</h2>
          <p>
            O assembleia.online amplia o alcance, as transmissões e a comunidade online.
            O AD Church continua essa experiência no dia a dia da congregação: culto acompanhado,
            Bíblia, Harpa, EBD, ministérios, grupos, agenda e cuidado pastoral.
          </p>
        </div>
      </section>

      <section className="editorialEcosystem shell">
        <div className="editorialEcosystemLead">
          <span>UM ECOSSISTEMA</span>
          <h2>Do alcance digital à vida da igreja local.</h2>
          <p>
            Os dois ambientes se complementam sem duplicar função: um alcança, transmite e conecta;
            o outro organiza o relacionamento contínuo de pessoas, congregações e ministérios.
          </p>
        </div>

        <div className="editorialEcosystemRows">
          <a href="https://www.assembleia.online/" target="_blank" rel="noreferrer">
            <span>ASSEMBLEIA.ONLINE</span>
            <strong>Ao vivo · Sermões · Telepaz · Membro Online</strong>
            <i>↗</i>
          </a>
          <Link href="/online">
            <span>AD CHURCH ONLINE</span>
            <strong>YouTube · Zoom · Google Meet · Grupos</strong>
            <i>→</i>
          </Link>
          <Link href="/app">
            <span>AD CHURCH LOCAL</span>
            <strong>Congregação · EBD · Ministérios · Agenda · Cuidado</strong>
            <i>→</i>
          </Link>
        </div>
      </section>

      <section className="editorialAccess shell" aria-label="Acessos principais">
        {access.map((item) => (
          <Link href={item.href} className="editorialAccessRow" key={item.href}>
            <span className="editorialAccessIndex">{item.index}</span>
            <span className="editorialAccessLabel">{item.label}</span>
            <span className="editorialAccessMain">
              <strong>{item.title}</strong>
              <small>{item.copy}</small>
            </span>
            <span className="editorialAccessArrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </section>

      <section className="editorialWorshipBand">
        <div className="shell editorialWorshipBandInner">
          <div className="editorialWorshipBandCopy">
            <span>NO CULTO</span>
            <h2>Menos procura. Mais atenção ao que está acontecendo.</h2>
            <p>
              A referência bíblica e o hino atual chegam à tela em tempo real.
              O membro acompanha sem cadastro, senha ou menus desnecessários.
            </p>
            <Link href="/culto">Abrir Modo Culto →</Link>
          </div>

          <div className="editorialWorshipFacts">
            <div>
              <strong>66</strong>
              <span>livros bíblicos</span>
            </div>
            <div>
              <strong>524</strong>
              <span>hinos catalogados</span>
            </div>
            <div>
              <strong>0</strong>
              <span>login para acompanhar</span>
            </div>
          </div>
        </div>
      </section>

      <section className="editorialSplit shell">
        <article>
          <span>PARA QUEM FREQUENTA</span>
          <h2>A igreja local vem primeiro.</h2>
          <p>
            Ao entrar, a pessoa encontra sua congregação, os próximos cultos, avisos,
            EBD, ministérios, grupos e jornadas que realmente fazem parte da vida dela.
          </p>
          <Link href="/app">Entrar em Minha Igreja →</Link>
        </article>

        <article>
          <span>PARA QUEM ESTÁ LONGE</span>
          <h2>A comunhão também pode começar por uma sala online.</h2>
          <p>
            Encontros com o pastor, grupos e reuniões podem apontar para Zoom, Google Meet,
            YouTube ou outro serviço, com acesso organizado conforme o público de cada encontro.
          </p>
          <Link href="/online">Ver encontros online →</Link>
        </article>
      </section>

      <section className="editorialStatement shell">
        <p>
          Tecnologia para ampliar o alcance da igreja —
          <strong> sem substituir o encontro, a comunhão ou o cuidado.</strong>
        </p>
      </section>

      <section className="editorialFinal">
        <div className="shell editorialFinalInner">
          <div>
            <span>AD CHURCH · ASSEMBLEIA DE DEUS ONLINE</span>
            <h2>Palavra, louvor, transmissão e comunidade no mesmo caminho.</h2>
          </div>
          <div className="editorialFinalActions">
            <Link href="/online">Conectar agora</Link>
            <Link href="/app">Minha Igreja</Link>
          </div>
        </div>
      </section>

      <footer className="editorialFooter shell">
        <Link className="brand" href="/">
          <span className="brandMark">AD</span>
          <span>Church</span>
        </Link>
        <p>Assembleia de Deus · Ministério do Belém · Setor 04 Santana</p>
      </footer>
    </main>
  );
}
