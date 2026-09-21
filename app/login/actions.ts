"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function bootstrapClaimed(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "claimed" in value &&
    (value as { claimed?: unknown }).claimed === true
  );
}

async function tryClaimInitialAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase.rpc("claim_initial_admin");
  if (error) return false;
  return bootstrapClaimed(data);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    redirect(`/login?error=missing${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const claimed = await tryClaimInitialAdmin(supabase);
  if (claimed) redirect("/admin");

  redirect(next.startsWith("/") ? next : "/app");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) redirect("/login?error=signup");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) redirect("/login?error=signup");

  if (data.session) {
    const claimed = await tryClaimInitialAdmin(supabase);
    if (claimed) redirect("/admin");
    redirect("/app");
  }

  redirect("/login?created=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
