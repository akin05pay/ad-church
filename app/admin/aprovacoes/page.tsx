import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decideAccessRequest } from "./actions";

export const metadata: Metadata = { title: "Aprovações" };
export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("access_requests")
    .select("id,user_id,organization_id,requested_role_id,requested_unit_id,requested_full_name,requested_email,requested_phone,requested_birth_date,match_status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  const requestIds = (requests ?? []).map((request) => request.id);
  const unitIds = [...new Set((requests ?? []).map((request) => request.requested_unit_id).filter(Boolean))];
  const roleIds = [...new Set((requests ?? []).map((request) => request.requested_role_id).filter(Boolean))];

  const [{ data: units }, { data: roles }, { data: steps }] = await Promise.all([
    unitIds.length
      ? supabase.from("units").select("id,name").in("id", unitIds)
      : Promise.resolve({ data: [] as any[] }),
    roleIds.length
      ? supabase.from("roles").select("id,name,key").in("id", roleIds)
      : Promise.resolve({ data: [] as any[] }),
    requestIds.length
      ? supabase
          .from("access_request_steps")
          .select("access_request_id,step_order,required_role_key,status")
          .in("access_request_id", requestIds)
          .order("step_order")
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const unitNames = new Map((units ?? []).map((unit) => [unit.id, unit.name]));
  const roleNames = new Map((roles ?? []).map((role) => [role.id, role.name]));

  return (
    <main className="privateShell">
      <div className="eyebrow">ADMINISTRAÇÃO · APROVAÇÕES</div>
      <div className="privateHeader">
        <div>
          <h1>Fila de vínculos</h1>
          <p>
            O banco mostra somente solicitações dentro do seu escopo. A etapa atual também é validada no banco antes de qualquer aprovação.
          </p>
        </div>
        <Link href="/admin">Voltar ao painel</Link>
      </div>

      {requests?.length ? (
        <div className="approvalGrid">
          {requests.map((request) => {
            const currentStep = (steps ?? []).find(
              (step) => step.access_request_id === request.id && step.status === "pending"
            );

            return (
              <article className="approvalCard" key={request.id}>
                <div>
                  <span className="cardLabel">SOLICITAÇÃO</span>
                  <h2>{request.requested_full_name || "Nome não informado"}</h2>
                  <p>{request.requested_email || request.requested_phone || "Sem contato informado"}</p>
                </div>

                <dl className="requestFacts">
                  <div><dt>Congregação</dt><dd>{unitNames.get(request.requested_unit_id) ?? "—"}</dd></div>
                  <div><dt>Papel</dt><dd>{roleNames.get(request.requested_role_id) ?? "—"}</dd></div>
                  <div><dt>Conciliação</dt><dd>{request.match_status}</dd></div>
                  <div><dt>Etapa atual</dt><dd>{currentStep?.required_role_key ?? "não configurada"}</dd></div>
                </dl>

                <div className="actionBar">
                  <form action={decideAccessRequest}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <button name="decision" value="approved">Aprovar etapa</button>
                  </form>
                  <form action={decideAccessRequest}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <button name="decision" value="rejected" className="secondaryButton">Rejeitar</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="notice">
          <strong>Nenhuma solicitação pendente no seu escopo.</strong>
          <span>Novos pedidos aparecerão aqui automaticamente.</span>
        </div>
      )}
    </main>
  );
}
