import type { Metadata } from "next";
import Link from "next/link";
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
        <p><Link href="/app">Voltar para Minha Igreja</Link></p>
      </main>
    );
  }

  return (
    <main className="privateShell">
      <div className="eyebrow">ADMINISTRAÇÃO</div>
      <h1>Painel AD Church</h1>
      <p>
        Você possui {assignments.length} atribuição(ões) ativa(s). O banco filtra cada módulo pelo seu papel e escopo.
      </p>

      <div className="adminGrid">
        <Link className="privateCard" href="/admin/aprovacoes">
          <strong>Aprovações</strong>
          <span>Revisar pedidos de vínculo e executar a etapa hierárquica permitida.</span>
        </Link>
        <Link className="privateCard" href="/admin/importacoes">
          <strong>Importações</strong>
          <span>Preparar congregações e membros em staging antes de aplicar ao cadastro oficial.</span>
        </Link>
        <Link className="privateCard" href="/culto">
          <strong>Modo culto</strong>
          <span>Acompanhamento público já conectado ao Realtime; console de operação entra na próxima camada.</span>
        </Link>
      </div>
    </main>
  );
}
