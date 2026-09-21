"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestChurchLink(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/app/vinculo");

  const target = String(formData.get("target") ?? "");
  const [organizationId, unitId] = target.split(":");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const birthDate = String(formData.get("birth_date") ?? "").trim() || null;

  if (!organizationId || !unitId || !fullName) {
    redirect("/app/vinculo?error=required");
  }

  const { data: memberRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("key", "member")
    .single();

  if (roleError || !memberRole) throw roleError ?? new Error("Papel de membro não configurado.");

  const { data: existing } = await supabase
    .from("access_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("requested_unit_id", unitId)
    .eq("requested_role_id", memberRole.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) redirect("/app/vinculo?pending=1");

  const { error } = await supabase.from("access_requests").insert({
    user_id: userId,
    organization_id: organizationId,
    requested_role_id: memberRole.id,
    requested_unit_id: unitId,
    requested_full_name: fullName,
    requested_email: email,
    requested_phone: phone,
    requested_birth_date: birthDate,
    reason: "Solicitação de vínculo como membro pelo PWA.",
  });

  if (error) throw error;

  revalidatePath("/app");
  redirect("/app/vinculo?created=1");
}
