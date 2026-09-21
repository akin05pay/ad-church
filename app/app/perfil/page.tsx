import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meu perfil",
  description: "Conta, cadastro e vínculos no AD Church.",
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

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/app/perfil");

  const accountEmail =
    typeof claimsData?.claims?.email === "string"
      ? claimsData.claims.email
      : "Conta autenticada";

  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id,person_id,created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("role_assignments")
      .select("id,role_id,organization_id,scope_unit_id,scope_ministry_id,status,granted_at")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  const { data: person } = profile?.person_id
    ? await supabase
        .from("people")
        .select("id,organization_id,full_name,email,phone,birth_date,created_at")
        .eq("id", profile.person_id)
        .maybeSingle()
    : { data: null };

  const { data: memberships } = person
    ? await supabase
        .from("memberships")
        .select("id,unit_id,membership_type,status,approved_at,created_at")
        .eq("person_id", person.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const unitIds = [...new Set((memberships ?? []).map((membership) => membership.unit_id))];
  const roleIds = [...new Set((assignments ?? []).map((assignment) => assignment.role_id))];

  const [{ data: units }, { data: roles }] = await Promise.all([
    unitIds.length
      ? supabase
          .from("units")
          .select("id,name,unit_type,city,state")
          .in("id", unitIds)
      : Promise.resolve({ data: [] }),
    roleIds.length
      ? supabase
          .from("roles")
          .select("id,key,name,level,authority_rank")
          .in("id", roleIds)
      : Promise.resolve({ data: [] }),
  ]);

  const unitById = new Map((units ?? []).map((unit) => [unit.id, unit]));
  const roleById = new Map((roles ?? []).map((role) => [role.id, role]));

  return (
    <main className="memberShell">
      <section className="memberProfileHero">
        <div>
          <span className="memberKicker">MEU PERFIL</span>
          <h1>{person?.full_name ?? "Sua conta AD Church"}</h1>
          <p>
            Conta digital, cadastro e vínculos são tratados separadamente para preservar
            a estrutura real da igreja.
          </p>
        </div>
        <Link href="/app" className="memberTextButton">← Minha Igreja</Link>
      </section>

      <section className="memberProfileGrid">
        <article className="memberSection memberPanel">
          <div className="memberSectionHeading">
            <div>
              <span>CONTA DIGITAL</span>
              <h2>Acesso</h2>
            </div>
          </div>
          <div className="memberDataList">
            <div><span>E-mail da conta</span><strong>{accountEmail}</strong></div>
            <div>
              <span>Cadastro vinculado</span>
              <strong>{person ? "Sim" : "Ainda não"}</strong>
            </div>
          </div>
          {!person && (
            <Link className="memberInlineAction" href="/app/vinculo">
              Solicitar vínculo →
            </Link>
          )}
        </article>

        <article className="memberSection memberPanel">
          <div className="memberSectionHeading">
            <div>
              <span>CADASTRO</span>
              <h2>Dados pessoais</h2>
            </div>
          </div>
          {person ? (
            <div className="memberDataList">
              <div><span>Nome</span><strong>{person.full_name}</strong></div>
              <div><span>E-mail cadastral</span><strong>{person.email ?? "Não informado"}</strong></div>
              <div><span>Telefone</span><strong>{person.phone ?? "Não informado"}</strong></div>
              <div><span>Nascimento</span><strong>{person.birth_date ?? "Não informado"}</strong></div>
            </div>
          ) : (
            <div className="memberEmpty compact">
              <strong>Conta ainda sem pessoa vinculada.</strong>
              <p>O cadastro aparece aqui depois da aprovação da secretaria.</p>
            </div>
          )}
        </article>
      </section>

      <section className="memberSection">
        <div className="memberSectionHeading">
          <div>
            <span>VÍNCULOS</span>
            <h2>Congregações</h2>
          </div>
        </div>

        {memberships?.length ? (
          <div className="memberMembershipList">
            {memberships.map((membership) => {
              const unit = unitById.get(membership.unit_id);
              return (
                <article key={membership.id}>
                  <div>
                    <strong>{unit?.name ?? "Congregação"}</strong>
                    <small>
                      {[unit?.city, unit?.state].filter(Boolean).join(" · ") ||
                        "Localidade não informada"}
                    </small>
                  </div>
                  <div>
                    <span>
                      {membershipLabels[membership.membership_type] ??
                        membership.membership_type}
                    </span>
                    <small>{membership.status}</small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="memberEmpty">
            <strong>Nenhum vínculo congregacional ativo.</strong>
            <p>Solicite o vínculo para liberar sua experiência local.</p>
            <Link href="/app/vinculo">Solicitar vínculo →</Link>
          </div>
        )}
      </section>

      <section className="memberSection">
        <div className="memberSectionHeading">
          <div>
            <span>FUNÇÕES</span>
            <h2>Acessos aprovados</h2>
          </div>
        </div>

        {assignments?.length ? (
          <div className="memberRoleList">
            {assignments.map((assignment) => {
              const role = roleById.get(assignment.role_id);
              return (
                <div key={assignment.id}>
                  <strong>{role?.name ?? "Função aprovada"}</strong>
                  <small>
                    Nível {role?.authority_rank ?? "—"} · {role?.level ?? "escopo"}
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="memberEmpty compact">
            <strong>Nenhuma função administrativa.</strong>
            <p>Seu vínculo como membro não depende de possuir função no sistema.</p>
          </div>
        )}
      </section>
    </main>
  );
}
