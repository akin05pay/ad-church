import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const metadata: Metadata = { title: "Minha Igreja" };
export const dynamic = "force-dynamic";

export default async function PrivateAppPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/app");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, person_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: requests } = await supabase
    .from("access_requests")
    .select("id,status,match_status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const linked = Boolean(profile?.person_id);

  return (
    <main className="privateShell">
      <div className="eyebrow">ÁREA AUTENTICADA</div>
      <div className="privateHeader">
        <div>
          <h1>Minha Igreja</h1>
          <p>Sua conta está autenticada. Conteúdo e permissões internos dependem do vínculo aprovado.</p>
        </div>
        <form><button formAction={logout}>Sair</button></form>
      </div>

      {!linked && (
        <div className="notice">
          <strong>Conta ainda não vinculada a uma pessoa da igreja.</strong>
          <span>Escolha sua congregação e envie o vínculo para aprovação da secretaria responsável.</span>
          <Link href="/app/vinculo"><strong>Solicitar vínculo →</strong></Link>
        </div>
      )}

      <div className="privateGrid">
        <div className="privateCard"><strong>Minha congregação</strong><span>{linked ? "Agenda, liderança e avisos locais." : "Disponível após aprovação do vínculo."}</span></div>
        <div className="privateCard"><strong>Meus ministérios</strong><span>{linked ? "Equipes, eventos, escalas e comunicações." : "Disponível conforme papéis aprovados."}</span></div>
        <div className="privateCard"><strong>Minha jornada</strong><span>{linked ? "EBD, discipulado e próximos passos." : "Será ativada após o vínculo."}</span></div>
      </div>

      <section className="section compactSection">
        <h2>Solicitações recentes</h2>
        {requests?.length ? (
          <div className="list">
            {requests.map((request) => (
              <article className="listItem" key={request.id}>
                <div>
                  <strong>{request.status}</strong>
                  <p>Conciliação: {request.match_status} · {new Date(request.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhuma solicitação de acesso foi criada ainda.</p>
        )}
      </section>

      <p><Link href="/">Voltar à área pública</Link></p>
    </main>
  );
}
