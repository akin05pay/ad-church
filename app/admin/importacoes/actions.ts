"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeDate, parseCsv, pick, slugify, type CsvRow } from "@/lib/imports/csv";

const MAX_FILE_BYTES = 750_000;
const MAX_ROWS = 5_000;
const CHUNK_SIZE = 250;

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?next=/admin/importacoes");
  return { supabase, userId: data.claims.sub };
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function memberRow(row: CsvRow, batchId: string, rowNumber: number) {
  const fullName = pick(row, ["nome", "nome_completo", "full_name", "membro"]);
  if (!fullName) throw new Error(`Linha ${rowNumber}: nome do membro não informado.`);

  return {
    batch_id: batchId,
    row_number: rowNumber,
    source_member_code: pick(row, ["codigo_membro", "codigo", "matricula", "member_code"]) || null,
    full_name: fullName,
    email: pick(row, ["email", "e_mail"]) || null,
    phone: pick(row, ["telefone", "celular", "whatsapp", "phone"]) || null,
    birth_date: normalizeDate(pick(row, ["data_nascimento", "nascimento", "birth_date"])),
    unit_name: pick(row, ["congregacao", "igreja", "unidade", "unit_name"]) || null,
    unit_slug: pick(row, ["congregacao_slug", "unit_slug", "slug_unidade"]) || null,
    raw_data: row,
  };
}

function unitRow(row: CsvRow, batchId: string, rowNumber: number) {
  const name = pick(row, ["nome", "congregacao", "unidade", "name"]);
  if (!name) throw new Error(`Linha ${rowNumber}: nome da congregação não informado.`);

  return {
    batch_id: batchId,
    row_number: rowNumber,
    parent_slug: pick(row, ["setor_slug", "parent_slug", "unidade_pai_slug"]) || null,
    unit_type: pick(row, ["tipo", "unit_type"]) || "congregation",
    name,
    slug: pick(row, ["slug", "congregacao_slug"]) || slugify(name),
    address_line: pick(row, ["endereco", "logradouro", "address"]) || null,
    city: pick(row, ["cidade", "city"]) || null,
    state: pick(row, ["uf", "estado", "state"]) || null,
    raw_data: row,
  };
}

export async function stageImport(formData: FormData) {
  const { supabase, userId } = await getAuthenticatedClient();

  const organizationId = String(formData.get("organization_id") ?? "");
  const scopeUnitId = String(formData.get("scope_unit_id") ?? "") || null;
  const entityType = String(formData.get("entity_type") ?? "");
  const sourceName = String(formData.get("source_name") ?? "").trim() || null;
  const file = formData.get("file");

  if (!organizationId || !["members", "units"].includes(entityType)) {
    redirect("/admin/importacoes?error=invalid");
  }

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/importacoes?error=file");
  }

  if (file.size > MAX_FILE_BYTES) {
    redirect("/admin/importacoes?error=size");
  }

  const records = parseCsv(await file.text());
  if (!records.length) redirect("/admin/importacoes?error=empty");
  if (records.length > MAX_ROWS) redirect("/admin/importacoes?error=rows");

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      organization_id: organizationId,
      scope_unit_id: scopeUnitId,
      entity_type: entityType,
      source_name: sourceName,
      original_filename: file.name,
      uploaded_by: userId,
      total_rows: records.length,
      status: "staged",
    })
    .select("id")
    .single();

  if (batchError || !batch) throw batchError ?? new Error("Não foi possível criar o lote.");

  const mapped =
    entityType === "members"
      ? records.map((row, index) => memberRow(row, batch.id, index + 2))
      : records.map((row, index) => unitRow(row, batch.id, index + 2));

  const table = entityType === "members" ? "member_import_rows" : "unit_import_rows";

  for (const part of chunk(mapped, CHUNK_SIZE)) {
    const { error } = await supabase.from(table).insert(part);
    if (error) throw error;
  }

  revalidatePath("/admin/importacoes");
  redirect(`/admin/importacoes/${batch.id}`);
}

export async function reconcileMemberBatch(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const batchId = String(formData.get("batch_id") ?? "");
  const { error } = await supabase.rpc("reconcile_member_import_batch", {
    target_batch_id: batchId,
  });
  if (error) throw error;
  revalidatePath(`/admin/importacoes/${batchId}`);
}

export async function setImportDecision(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const batchId = String(formData.get("batch_id") ?? "");
  const rowId = String(formData.get("row_id") ?? "");
  const entityType = String(formData.get("entity_type") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!["accepted", "rejected", "pending"].includes(decision)) return;
  const table = entityType === "members" ? "member_import_rows" : "unit_import_rows";

  const { error } = await supabase
    .from(table)
    .update({ decision })
    .eq("id", rowId)
    .eq("batch_id", batchId);

  if (error) throw error;
  revalidatePath(`/admin/importacoes/${batchId}`);
}

export async function acceptExactMemberRows(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const batchId = String(formData.get("batch_id") ?? "");

  const { error } = await supabase
    .from("member_import_rows")
    .update({ decision: "accepted" })
    .eq("batch_id", batchId)
    .eq("match_status", "exact");

  if (error) throw error;
  revalidatePath(`/admin/importacoes/${batchId}`);
}

export async function acceptAllUnitRows(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const batchId = String(formData.get("batch_id") ?? "");

  const { error } = await supabase
    .from("unit_import_rows")
    .update({ decision: "accepted" })
    .eq("batch_id", batchId);

  if (error) throw error;
  revalidatePath(`/admin/importacoes/${batchId}`);
}

export async function applyImportBatch(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const batchId = String(formData.get("batch_id") ?? "");
  const entityType = String(formData.get("entity_type") ?? "");

  const functionName =
    entityType === "members" ? "apply_member_import_batch" : "apply_unit_import_batch";

  const { error } = await supabase.rpc(functionName, {
    target_batch_id: batchId,
  });

  if (error) throw error;
  revalidatePath("/admin/importacoes");
  revalidatePath(`/admin/importacoes/${batchId}`);
}
