import Link from "next/link";
import { PublicNav } from "@/components/public-nav";

const quickActions = [
  {
    href: "/culto",
    kicker: "AGORA",
    title: "Acompanhar o culto",
    copy: "Veja a leitura bíblica e o hino atual em tempo real, sem login.",
    icon: "◉",
    accent: "live",
  },
  {
    href: "/biblia",
    kicker: "PALAVRA",
    title: "Abrir a Bíblia",
    copy: "66 livros, busca por referência, leitura confortável e acesso público.",
    icon: "✦",
    accent: "bible",
  },
  {
    href: "/hinarios",
    kicker: "LOUVOR",
    title: "Harpa Cristã",
    copy: "524 hinos catalogados para busca por número, título e uso no culto.",
    icon: "♪",
    accent: "hymnal",
  },
  {
    href: "/login",
    kicker: "COMUNIDADE",
    title: "Minha Igreja",
    copy: "Agenda, ministérios, EBD, avisos e vínculos da sua congregação.",
    icon: "⌂",
    accent: "church",
  },
];

const journey = [
  {
    number: "01",
    title: "Durante o culto",
    copy: "Bíblia, Harpa e referências do culto chegam à tela do celular em poucos toques.",
  },
  {
    number: "02",
    title: "Durante a semana",
    copy: "Agenda, avisos, EBD, ministérios e próximos passos continuam organizados no mesmo lugar.",
  },
  {
    number: "03",
    title: "Para cada pessoa",
    copy: "A experiência muda conforme congregação, vínculo, ministério e papel aprovado.",
  },
];

export default function HomePage() {
  return (
    <main className="homePage">
      <PublicNav />

      <section className="homeHeroShell">
        <div className="homeHeroGlow homeHeroGlowOne" aria-hidden="true" />
        <div className="homeHeroGlow homeHeroGlowTwo" aria-hidden="true" />

        <div className="homeHero">
          <div className="homeHeroCopy">
            <div className="homeHeroBadge">
              <span className="homeStatusDot" />
              AD Church · uma experiência digital para a igreja
            </div>

            <h1>
              A fé acompanha você.
              <span>Antes, durante e depois do culto.</span>
            </h1>

            <p>
              Bíblia, Harpa Cristã e acompanhamento do culto sem login.
              Vida congregacional, ministérios e cuidado pastoral com acesso seguro,
              contextual e aprovado pela igreja.
            </p>

            <div className="homeHeroActions">
              <Link className="homeButton homeButtonPrimary" href="/culto">
                <span>Acompanhar culto</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="homeButton homeButtonGhost" href="/biblia">
                Abrir a Bíblia
              </Link>
            </div>

            <div className="homeHeroTrust" aria-label="Características principais">
              <span><b>Sem login</b> para Bíblia e Harpa</span>
              <span><b>Realtime</b> no Modo Culto</span>
              <span><b>PWA</b> instalável no celular</span>
            </div>
          </div>

          <div className="homeDeviceStage" aria-label="Prévia da experiência no celular">
            <div className="homeOrbit homeOrbitOne" aria-hidden="true" />
            <div className="homeOrbit homeOrbitTwo" aria-hidden="true" />

            <div className="homePhone">
              <div className="homePhoneTop">
                <span>AD Church</span>
                <span className="homePhoneSignal">● ● ●</span>
              </div>

              <div className="homePhoneBody">
                <div className="homeLiveHeader">
                  <span className="homeLiveBadge"><i /> AO VIVO</span>
                  <span>Dom · 19:00</span>
                </div>

                <div className="homeServiceTitle">
                  <small>CULTO DE CELEBRAÇÃO</small>
                  <strong>Setor 04 · Santana</strong>
                  <span>Acompanhe pelo seu celular</span>
                </div>

                <div className="homePhoneCard homePhoneBible">
                  <div>
                    <span className="homePhoneLabel">LEITURA ATUAL</span>
                    <strong>João 3:16</strong>
                  </div>
                  <span className="homePhoneArrow">→</span>
                </div>

                <div className="homePhoneCard homePhoneHymn">
                  <div>
                    <span className="homePhoneLabel">HARPA CRISTÃ</span>
                    <strong>291 · A Mensagem da Cruz</strong>
                  </div>
                  <span className="homePhoneArrow">♪</span>
                </div>

                <div className="homePhoneUpdate">
                  <span className="homePulse" />
                  Atualizado em tempo real
                </div>

                <div className="homeMiniNav">
                  <span className="active">Hoje</span>
                  <span>Bíblia</span>
                  <span>Harpa</span>
                  <span>Igreja</span>
                </div>
              </div>
            </div>

            <div className="homeFloatingCard homeFloatingBible">
              <span>PALAVRA</span>
              <strong>66 livros</strong>
              <small>1.189 capítulos</small>
            </div>

            <div className="homeFloatingCard homeFloatingHarpa">
              <span>HARPA CRISTÃ</span>
              <strong>524 hinos</strong>
              <small>catálogo oficial</small>
            </div>
          </div>
        </div>
      </section>

      <section className="homeQuick shell" aria-labelledby="home-quick-title">
        <div className="homeSectionIntro">
          <div>
            <span className="homeSectionEyebrow">COMECE POR AQUI</span>
            <h2 id="home-quick-title">Tudo o que você precisa, no momento certo.</h2>
          </div>
          <p>
            A área pública prioriza o que realmente é usado no templo.
            O restante aparece quando a pessoa entra e tem seu vínculo aprovado.
          </p>
        </div>

        <div className="homeQuickGrid">
          {quickActions.map((item) => (
            <Link
              className={`homeQuickCard homeQuickCard-${item.accent}`}
              href={item.href}
              key={item.href}
            >
              <div className="homeQuickCardTop">
                <span className="homeQuickIcon" aria-hidden="true">{item.icon}</span>
                <span className="homeQuickArrow" aria-hidden="true">↗</span>
              </div>
              <span className="homeQuickKicker">{item.kicker}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="homeContinuum shell">
        <div className="homeContinuumPanel">
          <div className="homeContinuumHeader">
            <span className="homeSectionEyebrow homeSectionEyebrowLight">UMA EXPERIÊNCIA CONTÍNUA</span>
            <h2>O culto não termina quando a reunião acaba.</h2>
            <p>
              O AD Church conecta o momento público de adoração com a vida real da congregação:
              relacionamento, formação, serviço e cuidado.
            </p>
          </div>

          <div className="homeJourneyGrid">
            {journey.map((item) => (
              <article className="homeJourneyCard" key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="homeContext shell">
        <div className="homeContextCopy">
          <span className="homeSectionEyebrow">UMA HOME QUE CONHECE O CONTEXTO</span>
          <h2>Quando a pessoa entra, o aplicativo passa a mostrar a igreja dela.</h2>
          <p>
            Congregação, agenda local, ministérios, EBD, avisos e jornadas aparecem conforme
            o vínculo e as permissões aprovadas. O usuário não precisa navegar por uma estrutura
            gigantesca para encontrar o que importa.
          </p>

          <div className="homeContextChecks">
            <span><i>✓</i> Congregação primeiro</span>
            <span><i>✓</i> Conteúdo por vínculo</span>
            <span><i>✓</i> Permissões por escopo</span>
            <span><i>✓</i> Experiência simples para membros</span>
          </div>

          <Link className="homeTextLink" href="/login">
            Entrar em Minha Igreja <span>→</span>
          </Link>
        </div>

        <div className="homeFeedMock">
          <div className="homeFeedHeader">
            <div>
              <span>DOMINGO</span>
              <strong>Olá. Que bom ter você aqui.</strong>
            </div>
            <div className="homeAvatar">AD</div>
          </div>

          <div className="homeTodayCard">
            <span>HOJE NA SUA IGREJA</span>
            <strong>Culto de Celebração</strong>
            <p>19:00 · Congregação</p>
            <button type="button">Ver detalhes</button>
          </div>

          <div className="homeFeedRows">
            <div>
              <span className="homeFeedIcon">✦</span>
              <p><small>LEITURA</small><strong>Continue sua leitura bíblica</strong></p>
              <span>→</span>
            </div>
            <div>
              <span className="homeFeedIcon">◎</span>
              <p><small>MINHA JORNADA</small><strong>Próximo encontro de EBD</strong></p>
              <span>→</span>
            </div>
            <div>
              <span className="homeFeedIcon">♪</span>
              <p><small>MEU MINISTÉRIO</small><strong>Ensaio e escala da semana</strong></p>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      <section className="homeNumbers shell" aria-label="Estrutura da experiência pública">
        <div>
          <strong>66</strong>
          <span>livros bíblicos</span>
        </div>
        <div>
          <strong>1.189</strong>
          <span>capítulos no cânon protestante</span>
        </div>
        <div>
          <strong>524</strong>
          <span>hinos na Harpa Cristã</span>
        </div>
        <div>
          <strong>1</strong>
          <span>experiência para culto e comunidade</span>
        </div>
      </section>

      <section className="homeFinal shell">
        <div className="homeFinalPanel">
          <div>
            <span className="homeSectionEyebrow homeSectionEyebrowLight">AD CHURCH</span>
            <h2>A igreja cabe no celular.<br />A comunhão não cabe só na tela.</h2>
            <p>
              Tecnologia para tornar Bíblia, louvor, informação e vida congregacional
              mais acessíveis — sem substituir o encontro, o cuidado e a comunidade.
            </p>
          </div>
          <div className="homeFinalActions">
            <Link className="homeButton homeButtonLight" href="/culto">Acompanhar o culto</Link>
            <Link className="homeButton homeButtonOutlineLight" href="/login">Entrar</Link>
          </div>
        </div>
      </section>

      <footer className="homeFooter shell">
        <Link className="brand" href="/">
          <span className="brandMark">AD</span>
          <span>Church</span>
        </Link>
        <p>Bíblia · Harpa · Comunidade · Gestão congregacional</p>
      </footer>
    </main>
  );
}
