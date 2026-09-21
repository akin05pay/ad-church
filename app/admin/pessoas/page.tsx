import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createPerson,
  transferMembership,
  updateMembership,
  updatePerson,
} from "./actions";

export const metadata: Metadata = { title: "Pessoas" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const membershipTypes = [
  ["visitor", "Visitante"],
  ["attendee", "Frequentador"],
  ["convert", "Novo convertido"],
  ["member", "Membro"],
  ["worker", "Obreiro"],
  ["leader", "Líder"],
] as const;

const membershipLabels = new Map<string, string>(membershipTypes);

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  inactive: "Inativo",
  rejected: "Rejeitado",
};

export default async function PeopleAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/pessoas");

  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("organization_id,status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!assignments?.length) redirect("/admin");

  const availableOrganizations = [
    ...new Set(assignments.map((item) => item.organization_id)),
  ];
  const requestedOrg = typeof params.org === "string" ? params.org : null;
  const organizationId = availableOrganizations.includes(requestedOrg ?? "")
    ? requestedOrg!
    : availableOrganizations[0];

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const unitFilter = typeof params.unit === "string" ? params.unit : "";

  const [
    { data: organization },
    { data: organizations },
    { data: congregations },
    { data: people, error: peopleError },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,slug")
      .eq("id", organizationId)
      .single(),
    supabase
      .from("organizations")
      .select("id,name,slug")
      .in("id", availableOrganizations)
      .order("name"),
    supabase
      .from("units")
      .select("id,name,unit_type,parent_unit_id")
      .eq("organization_id", organizationId)
      .eq("unit_type", "congregation")
      .eq("active", true)
      .order("name"),
    supabase.rpc("list_manageable_people", {
      target_organization_id: organizationId,
      target_unit_id: unitFilter || undefined,
      search_text: q || undefined,
      result_limit: 200,
    }),
  ]);

  const ok = typeof params.ok === "string" ? params.ok : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="privateShell peopleAdminShell">
      <div className="privateHeader">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO · PESSOAS</div>
          <h1>Cadastro e vínculos</h1>
          <p>
            Pessoa, conta de login e função administrativa são camadas separadas.
            Aqui você administra o cadastro humano e o vínculo com a congregação.
          </p>
        </div>
        <Link className="button secondary" href="/admin">
          Administração
        </Link>
      </div>

      {(ok || error) && (
        <div className={"operatorMessage " + (error ? "operatorMessageError" : "")}>
          <strong>{error ? "Não foi possível concluir" : "Atualizado"}</strong>
          <span>{error ?? ok}</span>
        </div>
      )}

      <section className="peopleSummary">
        <div>
          <span>ORGANIZAÇÃO</span>
          <strong>{organization?.name ?? "AD Church"}</strong>
        </div>
        <div>
          <span>REGISTROS VISÍVEIS</span>
          <strong>{people?.length ?? 0}</strong>
        </div>
        <div>
          <span>CONGREGAÇÕES</span>
          <strong>{congregations?.length ?? 0}</strong>
        </div>
        <div>
          <span>SEGURANÇA</span>
          <strong>Escopo + RLS</strong>
        </div>
      </section>

      <section className="peopleTools">
        <form className="peopleSearch" method="get">
          {organizations && organizations.length > 1 && (
            <select name="org" defaultValue={organizationId}>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}

          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, e-mail ou telefone"
          />

          <select name="unit" defaultValue={unitFilter}>
            <option value="">Todas as congregações permitidas</option>
            {(congregations ?? []).map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>

          <button type="submit">Buscar</button>
        </form>
      </section>

      <section className="peopleLayout">
        <aside className="operatorPanel peopleCreatePanel">
          <div className="operatorPanelTitle">
            <span>Novo cadastro</span>
            <small>manual</small>
          </div>

          <form action={createPerson} className="operatorForm">
            <input type="hidden" name="organization_id" value={organizationId} />

            <label>
              Nome completo
              <input name="full_name" required autoComplete="name" />
            </label>

            <label>
              Congregação
              <select name="unit_id" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {(congregations ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </label>

            <label>
              Tipo de vínculo
              <select name="membership_type" defaultValue="member">
                {membershipTypes.map(([key, label]) => (
                  <option value={key} key={key}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" />
            </label>

            <label>
              Telefone
              <input name="phone" type="tel" autoComplete="tel" />
            </label>

            <label>
              Data de nascimento
              <input name="birth_date" type="date" />
            </label>

            <p className="governanceHint">
              Criar uma pessoa não cria automaticamente uma conta de login.
              O acesso digital continua sendo concedido por cadastro/convite e aprovação.
            </p>

            <button type="submit">Cadastrar pessoa</button>
          </form>
        </aside>

        <div className="operatorPanel peopleListPanel">
          <div className="operatorPanelTitle">
            <span>Pessoas no seu escopo</span>
            <small>{people?.length ?? 0}</small>
          </div>

          {peopleError ? (
            <div className="notice">
              <strong>Não foi possível carregar os registros.</strong>
              <span>Confirme se o seu papel possui permissão people.read ou people.manage.</span>
            </div>
          ) : people?.length ? (
            <div className="peopleList">
              {people.map((person) => (
                <article className="personRow" key={person.membership_id}>
                  <div className="personMain">
                    <div className="personAvatar" aria-hidden="true">
                      {person.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong>{person.full_name}</strong>
                      <small>
                        {person.email || person.phone || "Sem contato cadastrado"}
                      </small>
                    </div>
                  </div>

                  <div className="personContext">
                    <strong>{person.unit_name}</strong>
                    <small>{membershipLabels.get(person.membership_type) ?? person.membership_type}</small>
                  </div>

                  <div className="personBadges">
                    <span className={"governanceStatus governanceStatus-" + person.membership_status}>
                      {statusLabels[person.membership_status] ?? person.membership_status}
                    </span>
                    <span className={"personLoginBadge " + (person.has_user_account ? "linked" : "")}>
                      {person.has_user_account ? "COM LOGIN" : "SEM LOGIN"}
                    </span>
                  </div>

                  <details className="peopleDetails">
                    <summary>Gerenciar</summary>
                    <div className="peopleDetailGrid">
                      <form action={updatePerson} className="operatorForm">
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="person_id" value={person.person_id} />

                        <strong>Dados pessoais</strong>
                        <label>
                          Nome
                          <input name="full_name" required defaultValue={person.full_name} />
                        </label>
                        <label>
                          E-mail
                          <input name="email" type="email" defaultValue={person.email ?? ""} />
                        </label>
                        <label>
                          Telefone
                          <input name="phone" type="tel" defaultValue={person.phone ?? ""} />
                        </label>
                        <label>
                          Nascimento
                          <input name="birth_date" type="date" defaultValue={person.birth_date ?? ""} />
                        </label>
                        <button type="submit">Salvar cadastro</button>
                      </form>

                      <form action={updateMembership} className="operatorForm">
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="membership_id" value={person.membership_id} />

                        <strong>Vínculo congregacional</strong>
                        <label>
                          Tipo
                          <select name="membership_type" defaultValue={person.membership_type}>
                            {membershipTypes.map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Status
                          <select name="status" defaultValue={person.membership_status}>
                            <option value="active">Ativo</option>
                            <option value="pending">Pendente</option>
                            <option value="inactive">Inativo</option>
                            <option value="rejected">Rejeitado</option>
                          </select>
                        </label>
                        <button type="submit">Atualizar vínculo</button>
                      </form>

                      <form action={transferMembership} className="operatorForm">
                        <input type="hidden" name="organization_id" value={organizationId} />
                        <input type="hidden" name="membership_id" value={person.membership_id} />

                        <strong>Transferência</strong>
                        <p className="governanceHint">
                          A transferência só é executada se você tiver permissão sobre a congregação de origem e a de destino.
                        </p>
                        <label>
                          Congregação de destino
                          <select name="target_unit_id" required defaultValue="">
                            <option value="" disabled>Selecione</option>
                            {(congregations ?? [])
                              .filter((unit) => unit.id !== person.unit_id)
                              .map((unit) => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                              ))}
                          </select>
                        </label>
                        <button type="submit">Transferir vínculo</button>
                      </form>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="operatorEmpty">
              <span>○</span>
              <h2>Nenhum cadastro encontrado</h2>
              <p>Use o formulário ao lado ou altere os filtros.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
