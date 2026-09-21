import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administração" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin");

  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("id,status,role_id,organization_id,scope_unit_id,scope_ministry_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!assignments?.length) {
    return (
      <main className="privateShell">
        <div className="eyebrow">ADMINISTRAÇÃO</div>
        <h1>Acesso ainda não concedido</h1>
        <p>Esta área exige um papel administrativo aprovado pela hierarquia correspondente.</p>
      </main>
    );
  }

  return (
    <main className="privateShell">
      <div className="eyebrow">ADMINISTRAÇÃO</div>
      <h1>Painel AD Church</h1>
      <p>Você possui {assignments.length} atribuição(ões) ativa(s). Os módulos exibidos aqui serão filtrados por permissão e escopo.</p>
    </main>
  );
}
