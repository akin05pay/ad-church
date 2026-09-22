import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent, setEventStatus } from "./actions";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const visibilityLabels: Record<string, string> = {
  public: "Público",
  organization: "Organização",
  unit_members: "Membros da unidade",
  group_members: "Membros do grupo",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AgendaAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/agenda");

  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("organization_id,status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!assignments?.length) redirect("/admin");

  const orgIds = [...new Set(assignments.map((item) => item.organization_id))];
  const requestedOrg = typeof params.org === "string" ? params.org : null;
  const organizationId = orgIds.includes(requestedOrg ?? "") ? requestedOrg! : orgIds[0];

  const [
    { data: organization },
    { data: units },
    { data: ministries },
    { data: groups },
    { data: events },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("id", organizationId).single(),
    supabase.rpc("list_manageable_congregations", { target_organization_id: organizationId }),
    supabase
      .from("ministries")
      .select("id,name,unit_id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("groups")
      .select("id,name,unit_id,ministry_id,group_type,active")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("events")
      .select("id,title,event_type,visibility,starts_at,ends_at,status,unit_id,ministry_id,group_id,location_name")
      .eq("organization_id", organizationId)
      .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(100),
  ]);

  const unitById = new Map((units ?? []).map((u) => [u.id, u.name]));
  const ministryById = new Map((ministries ?? []).map((m) => [m.id, m.name]));
  const groupById = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const ok = typeof params.ok === "string" ? params.ok : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="privateShell agendaAdminShell">
      <div className="privateHeader">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO · AGENDA</div>
          <h1>Eventos e calendário</h1>
          <p>{organization?.name ?? "AD Church"} · os públicos são filtrados por RLS e escopo.</p>
        </div>
        <Link className="button secondary" href="/admin">Administração</Link>
      </div>

      {(ok || error) && (
        <div className={"operatorMessage " + (error ? "operatorMessageError" : "")}>
          <strong>{error ? "Não foi possível concluir" : "Atualizado"}</strong>
          <span>{error ?? ok}</span>
        </div>
      )}

      <section className="agendaAdminGrid">
        <aside className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Novo evento</span>
            <small>Horário de São Paulo</small>
          </div>
          <form action={createEvent} className="operatorForm">
            <input type="hidden" name="organization_id" value={organizationId} />

            <label>
              Título
              <input name="title" required placeholder="Ex.: EBD, culto, reunião..." />
            </label>

            <label>
              Tipo
              <select name="event_type" defaultValue="event">
                <option value="worship">Culto</option>
                <option value="ebd">EBD</option>
                <option value="meeting">Reunião</option>
                <option value="discipleship">Discipulado</option>
                <option value="ministry">Ministério</option>
                <option value="social">Social</option>
                <option value="event">Evento</option>
                <option value="other">Outro</option>
              </select>
            </label>

            <label>
              Início
              <input type="datetime-local" name="starts_at" required />
            </label>

            <label>
              Término
              <input type="datetime-local" name="ends_at" />
            </label>

            <label>
              Congregação
              <select name="unit_id" defaultValue="">
                <option value="">Organização inteira</option>
                {(units ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </label>

            <label>
              Ministério
              <select name="ministry_id" defaultValue="">
                <option value="">Sem ministério específico</option>
                {(ministries ?? []).map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}{unitById.get(ministry.unit_id) ? " · " + unitById.get(ministry.unit_id) : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Grupo
              <select name="group_id" defaultValue="">
                <option value="">Sem grupo específico</option>
                {(groups ?? []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}{unitById.get(group.unit_id) ? " · " + unitById.get(group.unit_id) : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Público
              <select name="visibility" defaultValue="unit_members">
                <option value="public">Público</option>
                <option value="organization">Usuários da organização</option>
                <option value="unit_members">Membros da unidade</option>
                <option value="group_members">Membros do grupo</option>
              </select>
            </label>

            <label>
              Local
              <input name="location_name" placeholder="Templo, salão, sala..." />
            </label>

            <label>
              Endereço
              <input name="address_line" />
            </label>

            <label>
              Descrição
              <textarea name="description" rows={4} />
            </label>

            <button type="submit">Publicar evento</button>
          </form>
        </aside>

        <section className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Próximos eventos</span>
            <small>{events?.length ?? 0}</small>
          </div>

          <div className="agendaAdminList">
            {(events ?? []).map((event) => (
              <article key={event.id} className="agendaAdminRow">
                <div>
                  <span>{event.event_type.toUpperCase()}</span>
                  <strong>{event.title}</strong>
                  <small>
                    {formatDate(event.starts_at)}
                    {event.unit_id ? " · " + (unitById.get(event.unit_id) ?? "unidade") : " · organização"}
                    {event.ministry_id ? " · " + (ministryById.get(event.ministry_id) ?? "ministério") : ""}
                    {event.group_id ? " · " + (groupById.get(event.group_id) ?? "grupo") : ""}
                  </small>
                </div>
                <div className="agendaAdminMeta">
                  <span>{visibilityLabels[event.visibility] ?? event.visibility}</span>
                  <strong>{event.status}</strong>
                </div>
                <div className="governanceActions">
                  {event.status === "scheduled" && (
                    <>
                      <form action={setEventStatus}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="event_id" value={event.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button type="submit">Concluir</button>
                      </form>
                      <form action={setEventStatus}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="event_id" value={event.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button className="secondaryButton" type="submit">Cancelar</button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            ))}
            {!events?.length && <p className="muted">Nenhum evento publicado neste escopo.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
