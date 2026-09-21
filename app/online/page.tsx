import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { createClient } from "@/lib/supabase/server";
import "../home-editorial.css";

export const metadata: Metadata = {
  title: "Online",
  description: "Cultos, encontros e conexões digitais da Assembleia de Deus Online e AD Church.",
};

export const dynamic = "force-dynamic";

const connections = [
  {
    kind: "TRANSMISSÃO",
    title: "Cultos e mensagens no YouTube",
    copy: "Acompanhe as transmissões e a biblioteca de mensagens da Assembleia de Deus Online.",
    href: "https://youtube.com/@assembleiaonline",
    external: true,
    action: "Abrir canal oficial",
  },
  {
    kind: "MEMBRO ONLINE",
    title: "Zoom com o pastor",
    copy: "A área de Membros Online reúne os próximos encontros exclusivos realizados pelo Zoom.",
    href: "https://www.assembleia.online/membros/login",
    external: true,
    action: "Entrar como membro online",
  },
  {
    kind: "GRUPOS",
    title: "Salas de Zoom e Google Meet",
    copy: "Os links de grupos, ministérios, discipulado e reuniões aparecem conforme o vínculo e a permissão de cada pessoa.",
    href: "/login",
    external: false,
    action: "Entrar no AD Church",
  },
  {
    kind: "CONTEÚDO",
    title: "Assembleia de Deus Online",
    copy: "Sermões, Telepaz, eventos, AD Kids, oração e os demais canais digitais continuam integrados ao ecossistema.",
    href: "https://www.assembleia.online/",
    external: true,
    action: "Visitar assembleia.online",
  },
];

const platformLabel: Record<string, string> = {
  youtube: "YouTube",
  zoom: "Zoom",
  google_meet: "Google Meet",
  other: "Online",
};

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function OnlinePage() {
  const supabase = await createClient();
  const from = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: meetings } = await supabase
    .from("online_meetings")
    .select("id,title,description,platform,join_url,starts_at,ends_at,status,visibility")
    .gte("starts_at", from)
    .in("status", ["scheduled", "live"])
    .order("starts_at", { ascending: true })
    .limit(12);

  return (
    <main className="editorialHome onlineHub">
      <PublicNav />

      <section className="onlineHero">
        <div className="shell onlineHeroInner">
          <p>ASSEMBLEIA DE DEUS ONLINE · AD CHURCH</p>
          <h1>Conecte-se de onde estiver.</h1>
          <span>
            Cultos, mensagens, encontros com o pastor e salas de grupos e ministérios
            em um único ponto de entrada.
          </span>
        </div>
      </section>

      <section className="shell onlineSchedule">
        <div>
          <span>QUARTA-FEIRA</span>
          <strong>19h30</strong>
          <small>Culto de Ensino</small>
        </div>
        <div>
          <span>DOMINGO</span>
          <strong>18h</strong>
          <small>Culto de Celebração</small>
        </div>
        <div>
          <span>2º SÁBADO</span>
          <strong>18h</strong>
          <small>Santa Ceia</small>
        </div>
      </section>

      {(meetings?.length ?? 0) > 0 && (
        <section className="shell onlineUpcoming">
          <div className="onlineUpcomingIntro">
            <span>PRÓXIMOS ENCONTROS</span>
            <h2>Entre no encontro certo.</h2>
            <p>
              Esta lista já respeita a visibilidade definida pela liderança. Reuniões privadas
              não são expostas para quem não possui o vínculo necessário.
            </p>
          </div>

          <div className="onlineMeetingList">
            {meetings?.map((meeting) => (
              <a
                href={meeting.join_url}
                target="_blank"
                rel="noreferrer"
                className="onlineMeetingRow"
                key={meeting.id}
              >
                <span className="onlineMeetingPlatform">
                  {platformLabel[meeting.platform] ?? "Online"}
                </span>
                <div>
                  <strong>{meeting.title}</strong>
                  <small>{meeting.description ?? "Encontro online"}</small>
                </div>
                <div className="onlineMeetingWhen">
                  <strong>{meeting.status === "live" ? "AO VIVO" : formatMeetingDate(meeting.starts_at)}</strong>
                  <small>{meeting.visibility === "public" ? "Público" : "Acesso autorizado"}</small>
                </div>
                <i>↗</i>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="shell onlineConnections">
        <div className="onlineConnectionsIntro">
          <span>CONEXÕES</span>
          <h2>Um acesso para cada momento.</h2>
          <p>
            O AD Church organiza as portas de entrada sem tentar substituir as plataformas
            que já funcionam. YouTube continua transmitindo. Zoom e Meet continuam sendo as salas.
            O AD Church organiza quem, quando e onde entrar.
          </p>
        </div>

        <div className="onlineConnectionRows">
          {connections.map((item) => {
            const body = (
              <>
                <span>{item.kind}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.copy}</small>
                </div>
                <i>{item.action} ↗</i>
              </>
            );

            return item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer" key={item.title}>
                {body}
              </a>
            ) : (
              <Link href={item.href} key={item.title}>
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="onlineGroups">
        <div className="shell onlineGroupsInner">
          <div>
            <span>CAMADA CONGREGACIONAL</span>
            <h2>Links organizados por contexto, não espalhados em mensagens.</h2>
          </div>
          <div className="onlinePlatformList">
            <span>Zoom</span>
            <span>Google Meet</span>
            <span>YouTube</span>
            <span>Outros links</span>
          </div>
          <p>
            A estrutura já aceita encontros públicos, autenticados ou restritos aos membros
            de uma unidade. O próximo passo é acrescentar grupos e ministérios como audiências
            específicas e dar aos líderes um console simples de publicação.
          </p>
        </div>
      </section>

      <section className="shell onlineBridge">
        <div>
          <span>ASSEMBLEIA.ONLINE</span>
          <strong>Alcance, transmissão e comunidade online.</strong>
        </div>
        <div className="onlineBridgeArrow">→</div>
        <div>
          <span>AD CHURCH</span>
          <strong>Vida congregacional, grupos e relacionamento contínuo.</strong>
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
