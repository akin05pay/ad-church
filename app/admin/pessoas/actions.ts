"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function requiredValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function back(
  kind: "ok" | "error",
  message: string,
  organizationId?: string | null,
): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  if (organizationId) params.set("org", organizationId);
  redirect("/admin/pessoas?" + params.toString());
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?next=/admin/pessoas");
  return supabase;
}

export async function createPerson(formData: FormData) {
  const supabase = await authenticatedClient();
  const organizationId = requiredValue(formData, "organization_id");
  const unitId = requiredValue(formData, "unit_id");
  const fullName = requiredValue(formData, "full_name");
  const membershipType = requiredValue(formData, "membership_type");

  if (!organizationId || !unitId || !fullName || !membershipType) {
    back("error", "Preencha nome, congregação e tipo de vínculo.", organizationId);
  }

  const { error } = await supabase.rpc("create_person_with_membership", {
    target_organization_id: organizationId,
    target_unit_id: unitId,
    person_full_name: fullName,
    person_email: textValue(formData, "email") ?? undefined,
    person_phone: textValue(formData, "phone") ?? undefined,
    person_birth_date: textValue(formData, "birth_date") ?? undefined,
    target_membership_type: membershipType,
  });

  if (error) {
    back(
      "error",
      error.message.includes("person_already_exists")
        ? "Já existe uma pessoa com esse e-mail nessa congregação."
        : "Não foi possível cadastrar. Confira seu escopo e os dados.",
      organizationId,
    );
  }

  revalidatePath("/admin/pessoas");
  back("ok", "Pessoa cadastrada e vínculo ativado.", organizationId);
}

export async function updatePerson(formData: FormData) {
  const supabase = await authenticatedClient();
  const organizationId = requiredValue(formData, "organization_id");
  const personId = requiredValue(formData, "person_id");
  const fullName = requiredValue(formData, "full_name");

  if (!personId || !fullName) {
    back("error", "Nome e pessoa são obrigatórios.", organizationId);
  }

  const { error } = await supabase.rpc("update_person_record", {
    target_person_id: personId,
    person_full_name: fullName,
    person_email: textValue(formData, "email") ?? undefined,
    person_phone: textValue(formData, "phone") ?? undefined,
    person_birth_date: textValue(formData, "birth_date") ?? undefined,
  });

  if (error) back("error", "Você não pode editar esta pessoa.", organizationId);

  revalidatePath("/admin/pessoas");
  back("ok", "Cadastro atualizado.", organizationId);
}

export async function updateMembership(formData: FormData) {
  const supabase = await authenticatedClient();
  const organizationId = requiredValue(formData, "organization_id");
  const membershipId = requiredValue(formData, "membership_id");
  const membershipType = requiredValue(formData, "membership_type");
  const status = requiredValue(formData, "status");

  if (!membershipId || !membershipType || !status) {
    back("error", "Vínculo inválido.", organizationId);
  }

  const { error } = await supabase.rpc("set_membership_details", {
    target_membership_id: membershipId,
    target_membership_type: membershipType,
    target_status: status,
  });

  if (error) back("error", "Não foi possível alterar este vínculo.", organizationId);

  revalidatePath("/admin/pessoas");
  back("ok", "Vínculo atualizado.", organizationId);
}

export async function transferMembership(formData: FormData) {
  const supabase = await authenticatedClient();
  const organizationId = requiredValue(formData, "organization_id");
  const membershipId = requiredValue(formData, "membership_id");
  const targetUnitId = requiredValue(formData, "target_unit_id");

  if (!membershipId || !targetUnitId) {
    back("error", "Escolha a congregação de destino.", organizationId);
  }

  const { error } = await supabase.rpc("transfer_membership", {
    target_membership_id: membershipId,
    target_unit_id: targetUnitId,
  });

  if (error) {
    back(
      "error",
      error.message.includes("same_congregation")
        ? "A pessoa já está nesta congregação."
        : "A transferência exige permissão sobre origem e destino.",
      organizationId,
    );
  }

  revalidatePath("/admin/pessoas");
  back("ok", "Vínculo transferido para a congregação de destino.", organizationId);
}
