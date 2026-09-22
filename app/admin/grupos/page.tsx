import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addGroupMember,
  createGroup,
  setGroupActive,
  setGroupMembershipStatus,
} from "./actions";

export const metadata: Metadata = { title: "Grupos" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const typeLabels: Record<string, string> = {
  small_group: "Grupo",
  discipleship: "Discipulado",
  ebd: "EBD",
  class: "Classe",
  committee: "Comissão",
  other: "Outro",
};

export default async function GroupsAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/grupos");

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
    { data: people },
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
      .select("id,name,description,group_type,visibility,unit_id,ministry_id,leader_person_id,active")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.rpc("list_manageable_people", {
      target_organization_id: organizationId,
      result_limit: 250,
    }),
  ]);

  const groupIds = (groups ?? []).map((group) => group.id);
  const { data: groupMemberships } = groupIds.length
    ? await supabase
        .from("group_memberships")
        .select("id,group_id,person_id,role,status,joined_at")
        .in("group_id", groupIds)
        .order("joined_at", { ascending: true })
    : { data: [] };

  const personById = new Map((people ?? []).map((person) => [person.person_id, person]));
  const unitById = new Map((units ?? []).map((unit) => [unit.id, unit.name]));
  const ministryById = new Map((ministries ?? []).map((ministry) => [ministry.id, ministry.name]));

  const ok = typeof params.ok === "string" ? params.ok : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="privateShell groupsAdminShell">
      <div className="privateHeader">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO · COMUNIDADE</div>
          <h1>Grupos e discipulado</h1>
          <p>{organization?.name ?? "AD Church"} · grupos respeitam congregação, ministério e escopo.</p>
        </div>
        <Link className="button secondary" href="/admin">Administração</Link>
      </div>

      {(ok || error) && (
        <div className={"operatorMessage " + (error ? "operatorMessageError" : "")}>
          <strong>{error ? "Não foi possível concluir" : "Atualizado"}</strong>
          <span>{error ?? ok}</span>
        </div>
      )}

      <section className="groupsAdminGrid">
        <aside className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Novo grupo</span>
            <small>estrutura local</small>
          </div>

          <form action={createGroup} className="operatorForm">
            <input type="hidden" name="organization_id" value={organizationId} />

            <label>
              Nome
              <input name="name" required placeholder="Ex.: Classe Jovens, Discipulado A..." />
            </label>

            <label>
              Congregação
              <select name="unit_id" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {(units ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </label>

            <label>
              Tipo
              <select name="group_type" defaultValue="small_group">
                <option value="small_group">Grupo</option>
                <option value="discipleship">Discipulado</option>
                <option value="ebd">EBD</option>
                <option value="class">Classe</option>
                <option value="committee">Comissão</option>
                <option value="other">Outro</option>
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
              Líder
              <select name="leader_person_id" defaultValue="">
                <option value="">A definir</option>
                {(people ?? []).map((person) => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.full_name} · {person.unit_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Visibilidade
              <select name="visibility" defaultValue="unit_members">
                <option value="unit_members">Membros da congregação</option>
                <option value="members_only">Somente participantes do grupo</option>
              </select>
            </label>

            <label>
              Descrição
              <textarea name="description" rows={4} />
            </label>

            <button type="submit">Criar grupo</button>
          </form>
        </aside>

        <section className="operatorPanel">
          <div className="operatorPanelTitle">
            <span>Grupos no seu escopo</span>
            <small>{groups?.length ?? 0}</small>
          </div>

          <div className="groupsAdminList">
            {(groups ?? []).map((group) => {
              const members = (groupMemberships ?? []).filter((item) => item.group_id === group.id);
              return (
                <article key={group.id} className="groupAdminCard">
                  <div className="groupAdminHeader">
                    <div>
                      <span>{typeLabels[group.group_type] ?? group.group_type}</span>
                      <h2>{group.name}</h2>
                      <p>
                        {unitById.get(group.unit_id) ?? "Congregação"}
                        {group.ministry_id ? " · " + (ministryById.get(group.ministry_id) ?? "Ministério") : ""}
                      </p>
                    </div>
                    <span className={"governanceStatus governanceStatus-" + (group.active ? "active" : "inactive")}>
                      {group.active ? "ativo" : "inativo"}
                    </span>
                  </div>

                  <p className="groupAdminDescription">{group.description ?? "Sem descrição."}</p>

                  <div className="groupAdminMembers">
                    {members.map((membership) => (
                      <div key={membership.id}>
                        <span>
                          <strong>{personById.get(membership.person_id)?.full_name ?? "Pessoa"}</strong>
                          <small>{membership.role} · {membership.status}</small>
                        </span>
                        <form action={setGroupMembershipStatus}>
                          <input type="hidden" name="organization_id" value={organizationId} />
                          <input type="hidden" name="membership_id" value={membership.id} />
                          <input type="hidden" name="status" value={membership.status === "active" ? "inactive" : "active"} />
                          <button className="secondaryButton" type="submit">
                            {membership.status === "active" ? "Inativar" : "Ativar"}
                          </button>
                        </form>
                      </div>
                    ))}
                    {!members.length && <small>Nenhum participante cadastrado.</small>}
                  </div>

                  <form action={addGroupMember} className="groupMemberAdd">
                    <input type="hidden" name="organization_id" value={organizationId} />
                    <input type="hidden" name="group_id" value={group.id} />
                    <select name="person_id" required defaultValue="">
                      <option value="" disabled>Adicionar pessoa</option>
                      {(people ?? [])
                        .filter((person) => person.unit_id === group.unit_id)
                        .map((person) => (
                          <option key={person.person_id} value={person.person_id}>
                            {person.full_name}
                          </option>
                        ))}
                    </select>
                    <select name="role" defaultValue="member">
                      <option value="member">Membro</option>
                      <option value="helper">Auxiliar</option>
                      <option value="leader">Líder</option>
                    </select>
                    <button type="submit">Vincular</button>
                  </form>

                  <form action={setGroupActive} className="groupArchiveForm">
                    <input type="hidden" name="organization_id" value={organizationId} />
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="active" value={group.active ? "false" : "true"} />
                    <button className="secondaryButton" type="submit">
                      {group.active ? "Arquivar grupo" : "Reativar grupo"}
                    </button>
                  </form>
                </article>
              );
            })}
            {!groups?.length && <p className="muted">Nenhum grupo criado ainda.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
