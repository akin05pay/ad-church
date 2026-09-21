"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function go(kind: "ok" | "error", message: string, organizationId?: string | null): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  if (organizationId) params.set("org", organizationId);
  redirect("/admin/equipe?" + params.toString());
}

async function clientAndUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/equipe");
  return { supabase, userId };
}

export async function createTeamInvitation(formData: FormData) {
  const { supabase } = await clientAndUser();
  const email = value(formData, "email");
  const roleId = value(formData, "role_id");
  const organizationId = value(formData, "organization_id");
  const unitId = value(formData, "scope_unit_id");
  const ministryId = value(formData, "scope_ministry_id");

  if (!email || !roleId || !organizationId) {
    go("error", "Preencha e-mail, papel e organização.", organizationId);
  }

  const { error } = await supabase.rpc("create_role_invitation", {
    target_email: email,
    target_role_id: roleId,
    target_organization_id: organizationId,
    target_unit_id: unitId ?? undefined,
    target_ministry_id: ministryId ?? undefined,
  });

  if (error) {
    go("error", "Não foi possível criar o convite. Confira papel e escopo.", organizationId);
  }

  revalidatePath("/admin/equipe");
  go("ok", "Convite criado. Se exigir aprovação superior, ele ficará pendente.", organizationId);
}

export async function decideTeamInvitation(formData: FormData) {
  const { supabase } = await clientAndUser();
  const invitationId = value(formData, "invitation_id");
  const decision = value(formData, "decision");
  const organizationId = value(formData, "organization_id");

  if (!invitationId || !decision) go("error", "Convite inválido.", organizationId);

  const { error } = await supabase.rpc("decide_role_invitation", {
    target_invitation_id: invitationId,
    decision,
  });

  if (error) go("error", "Você não pode decidir este convite.", organizationId);

  revalidatePath("/admin/equipe");
  go("ok", decision === "approved" ? "Convite aprovado." : "Convite revogado.", organizationId);
}

export async function moderateRoleAssignment(formData: FormData) {
  const { supabase } = await clientAndUser();
  const assignmentId = value(formData, "assignment_id");
  const status = value(formData, "status");
  const organizationId = value(formData, "organization_id");

  if (!assignmentId || !status) go("error", "Atribuição inválida.", organizationId);

  const { error } = await supabase.rpc("set_role_assignment_status", {
    target_assignment_id: assignmentId,
    new_status: status,
  });

  if (error) go("error", "Você não pode alterar este acesso.", organizationId);

  revalidatePath("/admin/equipe");
  go(
    "ok",
    status === "active"
      ? "Acesso reativado."
      : status === "suspended"
        ? "Acesso suspenso."
        : "Acesso revogado.",
    organizationId,
  );
}
