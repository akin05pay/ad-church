"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) redirect(`/login?error=missing${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  redirect(next.startsWith("/") ? next : "/app");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) redirect("/login?error=signup");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) redirect("/login?error=signup");

  redirect("/login?created=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
