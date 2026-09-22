import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Grupos",
  description: "Grupos, classes, EBD e discipulado da sua congregação.",
};

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  small_group: "Grupo",
  discipleship: "Discipulado",
  ebd: "EBD",
  class: "Classe",
  committee: "Comissão",
  other: "Outro",
};

export default async function MemberGroupsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/app/grupos");

  const { data: profile } = await supabase
    .from("profiles")
    .select("person_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.person_id) redirect("/app/vinculo");

  const [{ data: groups }, { data: memberships }] = await Promise.all([
    supabase
      .from("groups")
      .select("id,name,description,group_type,unit_id,ministry_id,leader_person_id")
      .eq("active", true)
      .order("name"),
    supabase
      .from("group_memberships")
      .select("group_id,role,status")
      .eq("person_id", profile.person_id),
  ]);

  const unitIds = [...new Set((groups ?? []).map((g) => g.unit_id))];
  const ministryIds = [...new Set((groups ?? []).map((g) => g.ministry_id).filter((id): id is string => Boolean(id)))];
  const membershipByGroup = new Map((memberships ?? []).map((m) => [m.group_id, m]));

  const [{ data: units }, { data: ministries }] = await Promise.all([
    unitIds.length ? supabase.from("units").select("id,name").in("id", unitIds) : Promise.resolve({ data: [] }),
    ministryIds.length ? supabase.from("ministries").select("id,name").in("id", ministryIds) : Promise.resolve({ data: [] }),
  ]);

  const unitById = new Map((units ?? []).map((u) => [u.id, u.name]));
  const ministryById = new Map((ministries ?? []).map((m) => [m.id, m.name]));

  return (
    <main className="memberShell">
      <section className="memberProfileHero">
        <div>
          <span className="memberKicker">GRUPOS</span>
          <h1>Comunidade que cabe na rotina.</h1>
          <p>Classes, EBD, discipulado e grupos aparecem conforme sua congregação e participação.</p>
        </div>
        <Link href="/app" className="memberTextButton">← Minha Igreja</Link>
      </section>

      <section className="memberSection">
        <div className="memberSectionHeading">
          <div>
            <span>SEU CONTEXTO</span>
            <h2>Grupos disponíveis</h2>
          </div>
        </div>

        {groups?.length ? (
          <div className="memberGroupGrid">
            {groups.map((group) => {
              const membership = membershipByGroup.get(group.id);
              return (
                <article key={group.id}>
                  <span>{typeLabels[group.group_type] ?? group.group_type}</span>
                  <h3>{group.name}</h3>
                  <p>{group.description ?? "Grupo da sua comunidade local."}</p>
                  <small>
                    {[unitById.get(group.unit_id), group.ministry_id ? ministryById.get(group.ministry_id) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <strong>{membership?.status === "active" ? "Você participa" : "Disponível no seu contexto"}</strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="memberEmpty">
            <strong>Nenhum grupo cadastrado ainda.</strong>
            <p>Assim que a liderança criar grupos, classes ou discipulados, eles aparecerão aqui.</p>
          </div>
        )}
      </section>
    </main>
  );
}
