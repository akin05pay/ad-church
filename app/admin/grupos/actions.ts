"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function back(kind: "ok" | "error", message: string, org?: string | null): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  if (org) params.set("org", org);
  redirect("/admin/grupos?" + params.toString());
}

async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/grupos");
  return { supabase, userId };
}

export async function createGroup(formData: FormData) {
  const { supabase, userId } = await authed();
  const organizationId = required(formData, "organization_id");
  const unitId = required(formData, "unit_id");
  const name = required(formData, "name");
  const groupType = required(formData, "group_type") || "small_group";
  const visibility = required(formData, "visibility") || "unit_members";

  if (!organizationId || !unitId || !name) {
    back("error", "Nome e congregação são obrigatórios.", organizationId);
  }

  const slug = slugify(name);
  if (!slug) back("error", "Informe um nome válido.", organizationId);

  const { error } = await supabase.from("groups").insert({
    organization_id: organizationId,
    unit_id: unitId,
    ministry_id: optional(formData, "ministry_id"),
    leader_person_id: optional(formData, "leader_person_id"),
    name,
    slug,
    description: optional(formData, "description"),
    group_type: groupType,
    visibility,
    active: true,
    created_by: userId,
  });

  if (error) {
    back(
      "error",
      error.message.includes("duplicate")
        ? "Já existe um grupo com esse nome nesta congregação."
        : "Não foi possível criar o grupo. Confira congregação, ministério e líder.",
      organizationId,
    );
  }

  revalidatePath("/admin/grupos");
  revalidatePath("/app/grupos");
  revalidatePath("/app");
  back("ok", "Grupo criado.", organizationId);
}

export async function addGroupMember(formData: FormData) {
  const { supabase, userId } = await authed();
  const organizationId = required(formData, "organization_id");
  const groupId = required(formData, "group_id");
  const personId = required(formData, "person_id");
  const role = required(formData, "role") || "member";

  if (!groupId || !personId) {
    back("error", "Escolha grupo e pessoa.", organizationId);
  }

  const { error } = await supabase.from("group_memberships").upsert(
    {
      group_id: groupId,
      person_id: personId,
      role,
      status: "active",
      approved_by: userId,
    },
    { onConflict: "group_id,person_id" },
  );

  if (error) {
    back(
      "error",
      "A pessoa precisa ter vínculo ativo na mesma congregação do grupo.",
      organizationId,
    );
  }

  revalidatePath("/admin/grupos");
  revalidatePath("/app/grupos");
  back("ok", "Participante vinculado ao grupo.", organizationId);
}

export async function setGroupMembershipStatus(formData: FormData) {
  const { supabase } = await authed();
  const organizationId = required(formData, "organization_id");
  const membershipId = required(formData, "membership_id");
  const status = required(formData, "status");

  if (!membershipId || !["active", "inactive", "pending"].includes(status)) {
    back("error", "Participação inválida.", organizationId);
  }

  const { error } = await supabase
    .from("group_memberships")
    .update({ status })
    .eq("id", membershipId);

  if (error) back("error", "Você não pode alterar esta participação.", organizationId);

  revalidatePath("/admin/grupos");
  revalidatePath("/app/grupos");
  back("ok", "Participação atualizada.", organizationId);
}

export async function setGroupActive(formData: FormData) {
  const { supabase } = await authed();
  const organizationId = required(formData, "organization_id");
  const groupId = required(formData, "group_id");
  const active = required(formData, "active") === "true";

  if (!groupId) back("error", "Grupo inválido.", organizationId);

  const { error } = await supabase
    .from("groups")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) back("error", "Você não pode alterar este grupo.", organizationId);

  revalidatePath("/admin/grupos");
  revalidatePath("/app/grupos");
  back("ok", active ? "Grupo reativado." : "Grupo arquivado.", organizationId);
}
