import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stageImport } from "./actions";

export const metadata: Metadata = { title: "Importações" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  invalid: "Selecione organização e tipo de cadastro.",
  file: "Selecione um arquivo CSV.",
  size: "O arquivo excede o limite desta etapa. Divida-o em lotes menores.",
  empty: "O CSV não contém linhas de dados.",
  rows: "O lote excede 5.000 linhas. Divida-o antes de importar.",
};

export default async function ImportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : null;
  const supabase = await createClient();

  const [{ data: organizations }, { data: units }, { data: batches }] = await Promise.all([
    supabase.from("organizations").select("id,name").order("name"),
    supabase
      .from("units")
      .select("id,organization_id,name,unit_type")
      .eq("active", true)
      .order("name"),
    supabase
      .from("import_batches")
      .select("id,entity_type,original_filename,status,total_rows,matched_rows,review_rows,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="privateShell">
      <div className="eyebrow">ADMINISTRAÇÃO · FOUNDATION 0.3</div>
      <div className="privateHeader">
        <div>
          <h1>Importações</h1>
          <p>
            Área de staging para receber futuramente as planilhas oficiais. Nenhuma linha importada
            concede acesso automaticamente.
          </p>
        </div>
        <Link href="/admin">Voltar ao painel</Link>
      </div>

      {errorCode && (
        <div className="notice">
          <strong>Importação não iniciada.</strong>
          <span>{errorMessages[errorCode] ?? "Confira o arquivo e tente novamente."}</span>
        </div>
      )}

      <section className="section compactSection">
        <div className="adminGrid">
          <article className="privateCard">
            <strong>Modelo de congregações</strong>
            <span>Use quando receber a relação oficial das congregações.</span>
            <a href="/templates/congregacoes.csv" download>Baixar CSV-modelo</a>
          </article>
          <article className="privateCard">
            <strong>Modelo de membros</strong>
            <span>Use como referência; o importador também reconhece cabeçalhos equivalentes.</span>
            <a href="/templates/membros.csv" download>Baixar CSV-modelo</a>
          </article>
        </div>
      </section>

      <section className="adminPanel">
        <h2>Novo lote</h2>
        {!organizations?.length ? (
          <div className="notice">
            <strong>A organização real ainda não foi cadastrada.</strong>
            <span>O importador já está pronto; o formulário será habilitado assim que a estrutura oficial existir.</span>
          </div>
        ) : (
          <form action={stageImport} className="adminForm">
            <label>
              Tipo de cadastro
              <select name="entity_type" required defaultValue="units">
                <option value="units">Congregações / unidades</option>
                <option value="members">Membros</option>
              </select>
            </label>

            <label>
              Organização
              <select name="organization_id" required>
                <option value="">Selecione</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </label>

            <label>
              Escopo administrativo
              <select name="scope_unit_id" defaultValue="">
                <option value="">Organização inteira</option>
                {(units ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} · {unit.unit_type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Identificação da fonte
              <input name="source_name" placeholder="Ex.: cadastro oficial da secretaria" />
            </label>

            <label>
              Arquivo CSV
              <input name="file" type="file" accept=".csv,text/csv" required />
            </label>

            <small className="muted">
              Limite operacional atual: 5.000 linhas e aproximadamente 750 KB por lote. O arquivo
              original não é armazenado no Storage; somente os dados necessários entram na área de staging.
            </small>

            <button type="submit">Criar lote de staging</button>
          </form>
        )}
      </section>

      <section className="section compactSection">
        <h2>Lotes recentes</h2>
        {batches?.length ? (
          <div className="list">
            {batches.map((batch) => (
              <Link className="listItem" href={`/admin/importacoes/${batch.id}`} key={batch.id}>
                <div>
                  <strong>{batch.entity_type === "members" ? "Membros" : "Congregações"} · {batch.original_filename}</strong>
                  <p>
                    {batch.status} · {batch.total_rows} linhas · {batch.matched_rows} conciliadas · {batch.review_rows} para revisão
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum lote foi criado.</p>
        )}
      </section>
    </main>
  );
}
