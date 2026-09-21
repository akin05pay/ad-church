"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function decideAccessRequest(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Sessão inválida.");

  const requestId = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!requestId || !["approved", "rejected"].includes(decision)) return;

  const { error } = await supabase.rpc("decide_access_request_step", {
    target_request_id: requestId,
    decision,
  });

  if (error) throw error;

  revalidatePath("/admin/aprovacoes");
  revalidatePath("/app");
}
