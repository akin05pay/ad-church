import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda da sua congregação, ministérios e grupos.",
};

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  worship: "Culto",
  ebd: "EBD",
  meeting: "Reunião",
  discipleship: "Discipulado",
  ministry: "Ministério",
  social: "Social",
  event: "Evento",
  other: "Outro",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MemberAgendaPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/app/agenda");

  const { data: profile } = await supabase
    .from("profiles")
    .select("person_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.person_id) {
    return (
      <main className="memberShell">
        <section className="memberProfileHero">
          <div>
            <span className="memberKicker">AGENDA</span>
            <h1>Vincule sua conta para ver a agenda da sua igreja.</h1>
            <p>
              Eventos internos são liberados conforme congregação, grupo e permissão.
            </p>
          </div>
          <Link href="/app/vinculo" className="memberTextButton">Solicitar vínculo →</Link>
        </section>
      </main>
    );
  }

  const { data: person } = await supabase
    .from("people")
    .select("organization_id,full_name")
    .eq("id", profile.person_id)
    .maybeSingle();

  if (!person) redirect("/app/vinculo");

  const { data: events } = await supabase
    .from("events")
    .select("id,title,description,event_type,starts_at,ends_at,location_name,address_line,visibility,unit_id,ministry_id,group_id,status")
    .eq("organization_id", person.organization_id)
    .gte("starts_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true })
    .limit(60);

  const unitIds = [...new Set((events ?? []).map((e) => e.unit_id).filter((id): id is string => Boolean(id)))];
  const ministryIds = [...new Set((events ?? []).map((e) => e.ministry_id).filter((id): id is string => Boolean(id)))];
  const groupIds = [...new Set((events ?? []).map((e) => e.group_id).filter((id): id is string => Boolean(id)))];

  const [{ data: units }, { data: ministries }, { data: groups }] = await Promise.all([
    unitIds.length
      ? supabase.from("units").select("id,name").in("id", unitIds)
      : Promise.resolve({ data: [] }),
    ministryIds.length
      ? supabase.from("ministries").select("id,name").in("id", ministryIds)
      : Promise.resolve({ data: [] }),
    groupIds.length
      ? supabase.from("groups").select("id,name").in("id", groupIds)
      : Promise.resolve({ data: [] }),
  ]);

  const unitById = new Map((units ?? []).map((item) => [item.id, item.name]));
  const ministryById = new Map((ministries ?? []).map((item) => [item.id, item.name]));
  const groupById = new Map((groups ?? []).map((item) => [item.id, item.name]));

  return (
    <main className="memberShell">
      <section className="memberProfileHero agendaMemberHero">
        <div>
          <span className="memberKicker">AGENDA</span>
          <h1>O que acontece na sua igreja.</h1>
          <p>
            Cultos, EBD, reuniões, discipulado e atividades aparecem conforme o seu vínculo.
          </p>
        </div>
        <Link href="/app" className="memberTextButton">← Minha Igreja</Link>
      </section>

      <section className="memberSection">
        <div className="memberSectionHeading">
          <div>
            <span>PRÓXIMOS</span>
            <h2>{events?.length ?? 0} compromissos visíveis</h2>
          </div>
        </div>

        {events?.length ? (
          <div className="memberAgendaList">
            {events.map((event) => (
              <article key={event.id}>
                <div className="memberAgendaDate">
                  <strong>{formatDate(event.starts_at)}</strong>
                  <span>{formatTime(event.starts_at)}</span>
                </div>
                <div className="memberAgendaBody">
                  <span>{typeLabels[event.event_type] ?? event.event_type}</span>
                  <h3>{event.title}</h3>
                  <p>{event.description ?? "Atividade da igreja."}</p>
                  <small>
                    {[
                      event.location_name,
                      event.unit_id ? unitById.get(event.unit_id) : null,
                      event.ministry_id ? ministryById.get(event.ministry_id) : null,
                      event.group_id ? groupById.get(event.group_id) : null,
                    ].filter(Boolean).join(" · ") || "Detalhes do local a confirmar"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="memberEmpty">
            <strong>Nenhum evento liberado para você neste momento.</strong>
            <p>A agenda muda automaticamente conforme a liderança publica atividades no seu escopo.</p>
          </div>
        )}
      </section>
    </main>
  );
}
