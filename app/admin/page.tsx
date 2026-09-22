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
        <Link className="privateCard" href="/admin/equipe">
          <strong>Equipe e hierarquia</strong>
          <span>Criar admins, aprovar papéis, suspender acessos e administrar a cadeia de autoridade.</span>
        </Link>
        <Link className="privateCard" href="/admin/pessoas">
          <strong>Pessoas e vínculos</strong>
          <span>Cadastrar pessoas, classificar vínculos, ativar, inativar e transferir entre congregações.</span>
        </Link>
        <Link className="privateCard" href="/admin/agenda">
          <strong>Agenda e eventos</strong>
          <span>Publicar cultos, EBD, reuniões e eventos com público definido por escopo.</span>
        </Link>
        <Link className="privateCard" href="/admin/grupos">
          <strong>Grupos e discipulado</strong>
          <span>Criar grupos, classes e discipulados e administrar participantes.</span>
        </Link>
        <Link className="privateCard" href="/admin/culto">
          <strong>Operação do culto</strong>
          <span>Publicar Bíblia, Harpa e avisos em tempo real para os celulares.</span>
        </Link>
        <Link className="privateCard" href="/admin/aprovacoes">
          <strong>Aprovações</strong>
          <span>Revisar pedidos de vínculo e executar a etapa hierárquica permitida.</span>
        </Link>
        <Link className="privateCard" href="/admin/importacoes">
          <strong>Importações</strong>
          <span>Preparar congregações e membros em staging antes de aplicar ao cadastro oficial.</span>
        </Link>
      </div>
    </main>
  );
}
