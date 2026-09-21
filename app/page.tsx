import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
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
    href: "/login",
    index: "04",
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
        <video
          className="editorialHeroVideo"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/media/hero-worship.mp4" type="video/mp4" />
        </video>

        <div className="editorialHeroShade" aria-hidden="true" />

        <div className="editorialHeroInner shell">
          <div className="editorialHeroTopline">
            <span>AD CHURCH</span>
            <span>MINISTÉRIO DO BELÉM</span>
          </div>

          <div className="editorialHeroContent">
            <p className="editorialHeroEyebrow">IGREJA · PALAVRA · COMUNIDADE</p>
            <h1>
              A fé acompanha você.
              <span>Antes, durante e depois do culto.</span>
            </h1>
            <p className="editorialHeroText">
              Bíblia, Harpa Cristã e acompanhamento do culto sem login.
              A vida da congregação aparece quando você entra.
            </p>

            <div className="editorialHeroActions">
              <Link href="/culto" className="editorialPrimaryAction">
                Acompanhar o culto <span>→</span>
              </Link>
              <Link href="/biblia" className="editorialSecondaryAction">
                Abrir a Bíblia
              </Link>
            </div>
          </div>

          <div className="editorialHeroFooter">
            <span>Setor 04 · Santana</span>
            <span>São Paulo</span>
            <span>Experiência pública + área privada</span>
          </div>
        </div>
      </section>

      <section className="editorialIntro shell">
        <div className="editorialIntroLabel">AD Church</div>
        <div className="editorialIntroBody">
          <h2>Um único lugar para acompanhar o culto e viver a igreja durante a semana.</h2>
          <p>
            A área pública começa pelo que realmente acontece no templo. A área autenticada
            continua a experiência com congregação, EBD, ministérios, agenda e cuidado pastoral.
          </p>
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
            EBD, ministérios e jornadas que realmente fazem parte da vida dela.
          </p>
          <Link href="/login">Entrar em Minha Igreja →</Link>
        </article>

        <article>
          <span>PARA QUEM CUIDA</span>
          <h2>A liderança enxerga o contexto certo.</h2>
          <p>
            Setor, congregação, ministério e grupo têm escopos próprios. Cada papel recebe
            somente o acesso necessário para servir, acompanhar e administrar.
          </p>
          <Link href="/login">Acessar área administrativa →</Link>
        </article>
      </section>

      <section className="editorialStatement shell">
        <p>
          Tecnologia para tornar a igreja mais acessível —
          <strong> sem substituir o encontro, a comunhão ou o cuidado.</strong>
        </p>
      </section>

      <section className="editorialFinal">
        <div className="shell editorialFinalInner">
          <div>
            <span>AD CHURCH</span>
            <h2>Palavra, louvor e comunidade no mesmo caminho.</h2>
          </div>
          <div className="editorialFinalActions">
            <Link href="/culto">Acompanhar culto</Link>
            <Link href="/login">Entrar</Link>
          </div>
        </div>
      </section>

      <footer className="editorialFooter shell">
        <Link className="brand" href="/">
          <span className="brandMark">AD</span>
          <span>Church</span>
        </Link>
        <p>Assembleia de Deus · Ministério do Belém</p>
      </footer>
    </main>
  );
}
