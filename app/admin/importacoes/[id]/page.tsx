import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  acceptAllUnitRows,
  acceptExactMemberRows,
  applyImportBatch,
  reconcileMemberBatch,
  setImportDecision,
} from "../actions";

export const metadata: Metadata = { title: "Revisar importação" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ImportBatchPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("id,entity_type,original_filename,source_name,status,total_rows,matched_rows,review_rows,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!batch) notFound();

  const table = batch.entity_type === "members" ? "member_import_rows" : "unit_import_rows";
  const fields =
    batch.entity_type === "members"
      ? "id,row_number,full_name,email,phone,birth_date,unit_name,unit_slug,match_status,match_score,decision"
      : "id,row_number,name,slug,parent_slug,unit_type,address_line,city,state,decision";

  const { data: rows } = await supabase
    .from(table)
    .select(fields)
    .eq("batch_id", id)
    .order("row_number")
    .limit(300);

  return (
    <main className="privateShell">
      <div className="eyebrow">REVISÃO DE STAGING</div>
      <div className="privateHeader">
        <div>
          <h1>{batch.entity_type === "members" ? "Membros" : "Congregações"}</h1>
          <p>{batch.original_filename} · {batch.total_rows} linhas · status: {batch.status}</p>
        </div>
        <Link href="/admin/importacoes">Voltar aos lotes</Link>
      </div>

      <div className="notice">
        <strong>Nada desta tela concede acesso por si só.</strong>
        <span>
          Primeiro revise e aceite as linhas. A aplicação do lote é uma ação separada e auditada.
        </span>
      </div>

      <section className="section compactSection actionBar">
        {batch.entity_type === "members" ? (
          <>
            <form action={reconcileMemberBatch}>
              <input type="hidden" name="batch_id" value={id} />
              <button>Executar conciliação</button>
            </form>
            <form action={acceptExactMemberRows}>
              <input type="hidden" name="batch_id" value={id} />
              <button className="secondaryButton">Aceitar apenas correspondências exatas</button>
            </form>
          </>
        ) : (
          <form action={acceptAllUnitRows}>
            <input type="hidden" name="batch_id" value={id} />
            <button className="secondaryButton">Aceitar todas as linhas após revisão</button>
          </form>
        )}

        <form action={applyImportBatch}>
          <input type="hidden" name="batch_id" value={id} />
          <input type="hidden" name="entity_type" value={batch.entity_type} />
          <button>Aplicar linhas aceitas</button>
        </form>
      </section>

      <section className="adminPanel">
        <h2>Prévia para revisão</h2>
        <p className="muted">São exibidas no máximo 300 linhas por vez nesta fundação.</p>
        <div className="reviewTableWrap">
          <table className="reviewTable">
            <thead>
              <tr>
                <th>Linha</th>
                <th>Registro</th>
                <th>Referência</th>
                <th>Conciliação</th>
                <th>Decisão</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row: any) => (
                <tr key={row.id}>
                  <td>{row.row_number}</td>
                  <td>
                    <strong>{batch.entity_type === "members" ? row.full_name : row.name}</strong>
                    {batch.entity_type === "members" && <small>{row.email || row.phone || "sem contato"}</small>}
                  </td>
                  <td>
                    {batch.entity_type === "members"
                      ? row.unit_slug || row.unit_name || "—"
                      : row.slug || "—"}
                  </td>
                  <td>
                    {batch.entity_type === "members"
                      ? `${row.match_status}${row.match_score ? ` · ${row.match_score}` : ""}`
                      : "revisão manual"}
                  </td>
                  <td>{row.decision}</td>
                  <td>
                    <form action={setImportDecision} className="inlineActions">
                      <input type="hidden" name="batch_id" value={id} />
                      <input type="hidden" name="row_id" value={row.id} />
                      <input type="hidden" name="entity_type" value={batch.entity_type} />
                      <button name="decision" value="accepted" className="smallButton">Aceitar</button>
                      <button name="decision" value="rejected" className="smallButton secondaryButton">Rejeitar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
