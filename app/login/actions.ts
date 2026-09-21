"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function claimedCount(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "claimed" in value &&
    typeof (value as { claimed?: unknown }).claimed === "number"
  ) {
    return (value as { claimed: number }).claimed;
  }
  return 0;
}

function bootstrapWasClaimed(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "claimed" in value &&
    (value as { claimed?: unknown }).claimed === true
  );
}

async function claimAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [bootstrap, invitations] = await Promise.all([
    supabase.rpc("claim_initial_admin"),
    supabase.rpc("claim_role_invitations"),
  ]);

  return (
    (!bootstrap.error && bootstrapWasClaimed(bootstrap.data)) ||
    (!invitations.error && claimedCount(invitations.data) > 0)
  );
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    redirect("/login?error=missing&next=" + encodeURIComponent(next));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid&next=" + encodeURIComponent(next));
  }

  const accessClaimed = await claimAccess(supabase);
  if (accessClaimed) redirect("/admin");

  redirect(next.startsWith("/") ? next : "/app");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) redirect("/login?error=signup");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "https://assembleia.church/auth/confirm?next=/app",
    },
  });

  if (error) redirect("/login?error=signup");

  if (data.session) {
    const accessClaimed = await claimAccess(supabase);
    if (accessClaimed) redirect("/admin");
    redirect("/app");
  }

  redirect("/login?created=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
