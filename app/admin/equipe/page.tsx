import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTeamInvitation,
  decideTeamInvitation,
  moderateRoleAssignment,
} from "./actions";

export const metadata: Metadata = { title: "Equipe e hierarquia" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/equipe");

  const { data: ownAssignments } = await supabase
    .from("role_assignments")
    .select("role_id,organization_id,scope_unit_id,scope_ministry_id,status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!ownAssignments?.length) {
    return (
      <main className="privateShell">
        <div className="eyebrow">GOVERNANÇA</div>
        <h1>Sem atribuição administrativa</h1>
        <p>Seu usuário ainda não possui um papel ativo para administrar equipe.</p>
        <Link href="/admin">Voltar</Link>
      </main>
    );
  }

  const roleIds = [...new Set(ownAssignments.map((item) => item.role_id))];
  const { data: ownRoles } = await supabase
    .from("roles")
    .select("id,key,name,level,authority_rank")
    .in("id", roleIds);

  const roleById = new Map((ownRoles ?? []).map((role) => [role.id, role]));
  const organizations = [...new Set(ownAssignments.map((item) => item.organization_id))];

  const requestedOrg = typeof params.org === "string" ? params.org : null;
  const organizationId = organizations.includes(requestedOrg ?? "")
    ? requestedOrg!
    : organizations[0];

  const ownRanks = ownAssignments
    .filter((item) => item.organization_id === organizationId)
    .map((item) => roleById.get(item.role_id)?.authority_rank ?? 0);

  const maxRank = Math.max(...ownRanks, 0);
  const isOwner = ownAssignments.some(
    (item) =>
      item.organization_id === organizationId &&
      roleById.get(item.role_id)?.key === "platform_owner",
  );

  const [
    { data: organization },
    { data: roles },
    { data: units },
    { data: ministries },
    { data: invitations },
    { data: team },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,slug").eq("id", organizationId).single(),
    supabase
      .from("roles")
      .select("id,key,name,level,authority_rank")
      .lt("authority_rank", maxRank)
      .neq("key", "platform_owner")
      .order("authority_rank", { ascending: false }),
    supabase
      .from("units")
      .select("id,name,unit_type,parent_unit_id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("ministries")
      .select("id,name,unit_id")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("role_invitations")
      .select("id,email,role_id,scope_unit_id,scope_ministry_id,status,created_at,expires_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("list_manageable_team", {
      target_organization_id: organizationId,
    }),
  ]);

  const inviteRoleIds = [...new Set((invitations ?? []).map((item) => item.role_id))];
  const { data: invitationRoles } = inviteRoleIds.length
    ? await supabase
        .from("roles")
        .select("id,key,name,level,authority_rank")
        .in("id", inviteRoleIds)
    : { data: [] };

  const inviteRoleById = new Map((invitationRoles ?? []).map((role) => [role.id, role]));
  const unitById = new Map((units ?? []).map((unit) => [unit.id, unit.name]));
  const ministryById = new Map((ministries ?? []).map((ministry) => [ministry.id, ministry.name]));

  const ok = typeof params.ok === "string" ? params.ok : null;
  const error = typeof params.error === "string" ? params.error : null;
  const topOwnRole = [...(ownRoles ?? [])].sort(
    (a, b) => b.authority_rank - a.authority_rank,
  )[0];

  return (
    <main className="privateShell governanceShell">
      <div className="privateHeader">
        <div>
          <div className="eyebrow">GOVERNANÇA · HIERARQUIA</div>
          <h1>Equipe e acessos</h1>
          <p>
            {organization?.name ?? "AD Church"} · seu teto atual é {maxRank}.
            {isOwner ? " Você é o proprietário raiz deste ambiente." : ""}
          </p>
        </div>
        <Link className="button secondary" href="/admin">Administração</Link>
      </div>

      {(ok || error) && (
        <div className={"operatorMessage " + (error ? "operatorMessageError" : "")}>
          <strong>{error ? "Não foi possível concluir" : "Atualizado"}</strong>
          <span>{error ?? ok}</span>
        </div>
      )}

      <section className="governanceHero">
        <div>
          <span>NÍVEL MÁXIMO</span>
          <strong>{isOwner ? "Proprietário da Plataforma" : topOwnRole?.name ?? "Administrador"}</strong>
          <small>
            Um usuário só pode propor ou conceder papéis abaixo do próprio nível e dentro do próprio escopo.
          </small>
        </div>
        <div className="governanceScale">
          <span><b>1000</b> Proprietário</span>
          <span><b>900</b> Admin técnico</span>
          <span><b>800–700</b> Setor</span>
          <span><b>600–500</b> Congregação</span>
          <span><b>400–300</b> Ministério / operação</span>
          <span><b>100</b> Membro</span>
        </div>
      </section>

      <section className="governanceGrid">
        <div className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Adicionar pessoa à equipe</span>
            <small>por e-mail</small>
          </div>
          <form action={createTeamInvitation} className="operatorForm">
            <input type="hidden" name="organization_id" value={organizationId} />
            <label>
              E-mail
              <input type="email" name="email" required placeholder="pessoa@exemplo.com" />
            </label>
            <label>
              Papel
              <select name="role_id" required defaultValue="">
                <option value="" disabled>Selecione o nível</option>
                {(roles ?? []).map((role) => (
                  <option value={role.id} key={role.id}>
                    {role.name} · nível {role.authority_rank}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Setor / congregação
              <select name="scope_unit_id" defaultValue="">
                <option value="">Sem escopo de unidade</option>
                {(units ?? []).map((unit) => (
                  <option value={unit.id} key={unit.id}>
                    {unit.name} · {unit.unit_type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ministério
              <select name="scope_ministry_id" defaultValue="">
                <option value="">Sem escopo de ministério</option>
                {(ministries ?? []).map((ministry) => (
                  <option value={ministry.id} key={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="governanceHint">
              Admin técnico usa escopo global. Papéis setoriais e locais exigem a unidade correspondente.
              Líder ministerial exige congregação + ministério.
            </p>
            <button type="submit">Criar convite</button>
          </form>
        </div>

        <div className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Convites e aprovações</span>
            <small>{invitations?.length ?? 0}</small>
          </div>
          <div className="governanceList">
            {(invitations ?? []).map((invite) => {
              const role = inviteRoleById.get(invite.role_id);
              const unitName = invite.scope_unit_id
                ? unitById.get(invite.scope_unit_id) ?? "unidade"
                : "global";
              const ministryName = invite.scope_ministry_id
                ? ministryById.get(invite.scope_ministry_id) ?? "ministério"
                : null;

              return (
                <article className="governanceRow" key={invite.id}>
                  <div>
                    <strong>{invite.email}</strong>
                    <small>
                      {role?.name ?? "Papel"} · {unitName}
                      {ministryName ? " · " + ministryName : ""}
                    </small>
                  </div>
                  <span className={"governanceStatus governanceStatus-" + invite.status}>
                    {invite.status}
                  </span>
                  {(invite.status === "pending" || invite.status === "approved") && (
                    <div className="governanceActions">
                      {invite.status === "pending" && (
                        <form action={decideTeamInvitation}>
                          <input type="hidden" name="organization_id" value={organizationId} />
                          <input type="hidden" name="invitation_id" value={invite.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button type="submit">Aprovar</button>
                        </form>
                      )}
                      <form action={decideTeamInvitation}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="invitation_id" value={invite.id} />
                        <input type="hidden" name="decision" value="revoked" />
                        <button className="secondaryButton" type="submit">Revogar</button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
            {!invitations?.length && <p className="muted">Nenhum convite registrado ainda.</p>}
          </div>
        </div>
      </section>

      <section className="operatorPanel governanceTeamPanel">
        <div className="operatorPanelTitle">
          <span>Equipe ativa e moderada</span>
          <small>{team?.length ?? 0}</small>
        </div>
        <div className="governanceTeamTable">
          {(team ?? []).map((person) => {
            const isSelf = person.user_id === userId;
            return (
              <article className="governanceTeamRow" key={person.assignment_id}>
                <div>
                  <strong>{person.email}</strong>
                  <small>{person.role_name} · nível {person.authority_rank}</small>
                </div>
                <div>
                  <strong>{person.unit_name ?? "Escopo global"}</strong>
                  <small>{person.ministry_name ?? "Sem ministério específico"}</small>
                </div>
                <span className={"governanceStatus governanceStatus-" + person.status}>
                  {person.status}
                </span>
                {!isSelf && (
                  <div className="governanceActions">
                    {person.status === "active" ? (
                      <form action={moderateRoleAssignment}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="assignment_id" value={person.assignment_id} />
                        <input type="hidden" name="status" value="suspended" />
                        <button className="secondaryButton" type="submit">Suspender</button>
                      </form>
                    ) : (
                      <form action={moderateRoleAssignment}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="assignment_id" value={person.assignment_id} />
                        <input type="hidden" name="status" value="active" />
                        <button type="submit">Reativar</button>
                      </form>
                    )}
                    {person.status !== "revoked" && (
                      <form action={moderateRoleAssignment}>
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="assignment_id" value={person.assignment_id} />
                        <input type="hidden" name="status" value="revoked" />
                        <button className="dangerButton" type="submit">Revogar</button>
                      </form>
                    )}
                  </div>
                )}
                {isSelf && <span className="governanceSelf">VOCÊ</span>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
