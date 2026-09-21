import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Minha Igreja",
  description: "Sua congregação, culto, Bíblia, encontros e vínculos no AD Church.",
};

export const dynamic = "force-dynamic";

const membershipLabels: Record<string, string> = {
  visitor: "Visitante",
  attendee: "Frequentador",
  convert: "Novo convertido",
  member: "Membro",
  worker: "Obreiro",
  leader: "Líder",
};

const platformLabels: Record<string, string> = {
  youtube: "YouTube",
  zoom: "Zoom",
  google_meet: "Google Meet",
  other: "Online",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export default async function PrivateAppPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/app");

  const [{ data: profile }, { data: requests }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_id,person_id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("access_requests")
        .select("id,status,match_status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("role_assignments")
        .select("id,role_id,organization_id,scope_unit_id,scope_ministry_id,status,granted_at")
        .eq("user_id", userId)
        .eq("status", "active"),
    ]);

  if (!profile?.person_id) {
    return (
      <main className="memberShell">
        <section className="memberOnboardingHero">
          <span className="memberKicker">MINHA IGREJA</span>
          <h1>Seu acesso começou. Agora falta ligar sua conta à sua congregação.</h1>
          <p>
            A Bíblia, a Harpa e o Modo Culto continuam disponíveis sem vínculo.
            Para ver sua congregação, agenda e conteúdos internos, envie a solicitação
            para aprovação da secretaria responsável.
          </p>
          <div className="memberHeroActions">
            <Link href="/app/vinculo" className="memberPrimaryButton">
              Solicitar vínculo
            </Link>
            <Link href="/culto" className="memberTextButton">
              Acompanhar culto →
            </Link>
          </div>
        </section>

        <section className="memberOnboardingSteps">
          <article>
            <span>01</span>
            <strong>Identifique sua congregação</strong>
            <p>Informe seus dados e a igreja local com a qual você possui vínculo.</p>
          </article>
          <article>
            <span>02</span>
            <strong>A secretaria confere</strong>
            <p>O sistema concilia o cadastro e envia para a autoridade correta.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Minha Igreja é liberada</strong>
            <p>Após a aprovação, a experiência passa a refletir sua congregação e seus acessos.</p>
          </article>
        </section>

        <section className="memberQuickGrid">
          <Link href="/biblia"><span>PALAVRA</span><strong>Abrir Bíblia</strong><i>→</i></Link>
          <Link href="/hinarios"><span>LOUVOR</span><strong>Abrir Harpa</strong><i>→</i></Link>
          <Link href="/culto"><span>AGORA</span><strong>Modo Culto</strong><i>→</i></Link>
          <Link href="/online"><span>ONLINE</span><strong>Encontros e transmissões</strong><i>→</i></Link>
        </section>

        <section className="memberSection">
          <div className="memberSectionHeading">
            <div>
              <span>SOLICITAÇÕES</span>
              <h2>Andamento do vínculo</h2>
            </div>
          </div>

          {requests?.length ? (
            <div className="memberRequestList">
              {requests.map((request) => (
                <article key={request.id}>
                  <div>
                    <strong>{request.status}</strong>
                    <small>Conciliação: {request.match_status}</small>
                  </div>
                  <time>{formatDateTime(request.created_at)}</time>
                </article>
              ))}
            </div>
          ) : (
            <div className="memberEmpty">
              <strong>Nenhuma solicitação enviada.</strong>
              <p>Quando você solicitar o vínculo, o andamento aparecerá aqui.</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  const { data: person } = await supabase
    .from("people")
    .select("id,organization_id,full_name,email,phone,birth_date")
    .eq("id", profile.person_id)
    .maybeSingle();

  if (!person) {
    redirect("/app/vinculo");
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id,unit_id,membership_type,status,approved_at,created_at")
    .eq("person_id", person.id)
    .order("created_at", { ascending: true });

  const mainMembership =
    memberships?.find((membership) => membership.status === "active") ??
    memberships?.[0] ??
    null;

  const membershipUnitIds = [...new Set((memberships ?? []).map((item) => item.unit_id))];
  const { data: membershipUnits } = membershipUnitIds.length
    ? await supabase
        .from("units")
        .select("id,name,unit_type,parent_unit_id,address_line,city,state")
        .in("id", membershipUnitIds)
    : { data: [] };

  const unitById = new Map((membershipUnits ?? []).map((unit) => [unit.id, unit]));
  const congregation = mainMembership ? unitById.get(mainMembership.unit_id) ?? null : null;

  const parentId = congregation?.parent_unit_id ?? null;
  const { data: parentUnit } = parentId
    ? await supabase
        .from("units")
        .select("id,name,unit_type,parent_unit_id,city,state")
        .eq("id", parentId)
        .maybeSingle()
    : { data: null };

  const roleIds = [...new Set((assignments ?? []).map((item) => item.role_id))];
  const ministryIds = [
    ...new Set(
      (assignments ?? [])
        .map((item) => item.scope_ministry_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    { data: roles },
    { data: assignedMinistries },
    { data: localMinistries },
    { data: meetings },
  ] = await Promise.all([
    roleIds.length
      ? supabase
          .from("roles")
          .select("id,key,name,level,authority_rank")
          .in("id", roleIds)
      : Promise.resolve({ data: [] }),
    ministryIds.length
      ? supabase
          .from("ministries")
          .select("id,name,slug,unit_id")
          .in("id", ministryIds)
      : Promise.resolve({ data: [] }),
    congregation
      ? supabase
          .from("ministries")
          .select("id,name,slug,unit_id")
          .eq("organization_id", person.organization_id)
          .eq("unit_id", congregation.id)
          .eq("active", true)
          .order("name")
          .limit(12)
      : Promise.resolve({ data: [] }),
    supabase
      .from("online_meetings")
      .select("id,title,description,platform,join_url,starts_at,status,visibility,unit_id,ministry_id")
      .eq("organization_id", person.organization_id)
      .gte("starts_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .in("status", ["scheduled", "live"])
      .order("starts_at", { ascending: true })
      .limit(5),
  ]);

  const roleById = new Map((roles ?? []).map((role) => [role.id, role]));
  const ministryById = new Map(
    (assignedMinistries ?? []).map((ministry) => [ministry.id, ministry]),
  );
  const adminAssignment = (assignments ?? []).find(
    (assignment) => (roleById.get(assignment.role_id)?.authority_rank ?? 0) >= 300,
  );

  return (
    <main className="memberShell">
      <section className="memberWelcome">
        <div>
          <span className="memberKicker">MINHA IGREJA</span>
          <h1>Olá, {firstName(person.full_name)}.</h1>
          <p>
            {congregation
              ? congregation.name + (parentUnit?.name ? " · " + parentUnit.name : "")
              : "Seu cadastro está vinculado, mas ainda não há congregação ativa."}
          </p>
        </div>

        <div className="memberIdentityCard">
          <span>SEU VÍNCULO</span>
          <strong>
            {mainMembership
              ? membershipLabels[mainMembership.membership_type] ?? mainMembership.membership_type
              : "Em definição"}
          </strong>
          <small>
            {mainMembership?.status === "active"
              ? "Vínculo ativo"
              : mainMembership?.status ?? "Sem vínculo ativo"}
          </small>
        </div>
      </section>

      <section className="memberQuickGrid">
        <Link href="/biblia"><span>PALAVRA</span><strong>Abrir Bíblia</strong><i>→</i></Link>
        <Link href="/hinarios"><span>LOUVOR</span><strong>Abrir Harpa</strong><i>→</i></Link>
        <Link href="/culto"><span>AGORA</span><strong>Modo Culto</strong><i>→</i></Link>
        <Link href="/online"><span>ONLINE</span><strong>Encontros e transmissões</strong><i>→</i></Link>
      </section>

      <section className="memberChurchContext">
        <div className="memberChurchPrimary">
          <span>SUA CONGREGAÇÃO</span>
          <h2>{congregation?.name ?? "Congregação em definição"}</h2>
          <p>
            {[congregation?.address_line, congregation?.city, congregation?.state]
              .filter(Boolean)
              .join(" · ") || "Endereço ainda não cadastrado."}
          </p>
        </div>

        <div className="memberChurchFacts">
          <div>
            <span>SETOR / CAMPO</span>
            <strong>{parentUnit?.name ?? "A definir"}</strong>
          </div>
          <div>
            <span>VÍNCULO</span>
            <strong>
              {mainMembership
                ? membershipLabels[mainMembership.membership_type] ?? mainMembership.membership_type
                : "A definir"}
            </strong>
          </div>
          <div>
            <span>MINISTÉRIOS LOCAIS</span>
            <strong>{localMinistries?.length ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="memberSection">
        <div className="memberSectionHeading">
          <div>
            <span>PRÓXIMOS ENCONTROS</span>
            <h2>O que vem agora</h2>
          </div>
          <Link href="/online">Ver área Online →</Link>
        </div>

        {meetings?.length ? (
          <div className="memberMeetingList">
            {meetings.map((meeting) => (
              <a
                href={meeting.join_url}
                target="_blank"
                rel="noreferrer"
                key={meeting.id}
              >
                <span>{platformLabels[meeting.platform] ?? "Online"}</span>
                <div>
                  <strong>{meeting.title}</strong>
                  <small>{meeting.description ?? "Encontro da igreja"}</small>
                </div>
                <time>
                  {meeting.status === "live" ? "AO VIVO" : formatDateTime(meeting.starts_at)}
                </time>
                <i>↗</i>
              </a>
            ))}
          </div>
        ) : (
          <div className="memberEmpty">
            <strong>Nenhum encontro online liberado para você agora.</strong>
            <p>Quando a liderança publicar uma reunião para o seu público, ela aparecerá aqui.</p>
          </div>
        )}
      </section>

      <section className="memberTwoColumn">
        <article className="memberSection memberPanel">
          <div className="memberSectionHeading">
            <div>
              <span>PARTICIPAÇÃO</span>
              <h2>Funções e ministérios</h2>
            </div>
          </div>

          {(assignments?.length ?? 0) > 0 ? (
            <div className="memberRoleList">
              {assignments?.map((assignment) => {
                const role = roleById.get(assignment.role_id);
                const ministry = assignment.scope_ministry_id
                  ? ministryById.get(assignment.scope_ministry_id)
                  : null;
                return (
                  <div key={assignment.id}>
                    <strong>{role?.name ?? "Função aprovada"}</strong>
                    <small>
                      {ministry?.name ??
                        (assignment.scope_unit_id === congregation?.id
                          ? congregation?.name
                          : "Escopo institucional")}
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="memberEmpty compact">
              <strong>Sem funções administrativas.</strong>
              <p>Isso não interfere no seu vínculo como membro.</p>
            </div>
          )}

          {adminAssignment && (
            <Link className="memberInlineAction" href="/admin">
              Abrir Administração →
            </Link>
          )}
        </article>

        <article className="memberSection memberPanel">
          <div className="memberSectionHeading">
            <div>
              <span>CONGREGAÇÃO</span>
              <h2>Ministérios locais</h2>
            </div>
          </div>

          {localMinistries?.length ? (
            <div className="memberMinistryCloud">
              {localMinistries.map((ministry) => (
                <span key={ministry.id}>{ministry.name}</span>
              ))}
            </div>
          ) : (
            <div className="memberEmpty compact">
              <strong>Nenhum ministério cadastrado ainda.</strong>
              <p>O catálogo local aparecerá quando a estrutura oficial for carregada.</p>
            </div>
          )}
        </article>
      </section>

      <section className="memberStatement">
        <span>AD CHURCH</span>
        <p>
          A área do membro mostra apenas o que pertence ao seu contexto.
          <strong> Bíblia e culto continuam públicos; dados internos dependem de vínculo e permissão.</strong>
        </p>
      </section>
    </main>
  );
}
