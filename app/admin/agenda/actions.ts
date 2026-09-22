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

function toIsoSaoPaulo(value: string | null) {
  if (!value) return null;
  const normalized = value.length === 16 ? value + ":00" : value;
  const date = new Date(normalized + "-03:00");
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function back(kind: "ok" | "error", message: string, org?: string | null): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  if (org) params.set("org", org);
  redirect("/admin/agenda?" + params.toString());
}

async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin/agenda");
  return { supabase, userId };
}

export async function createEvent(formData: FormData) {
  const { supabase, userId } = await authed();
  const organizationId = required(formData, "organization_id");
  const title = required(formData, "title");
  const eventType = required(formData, "event_type") || "event";
  const visibility = required(formData, "visibility") || "unit_members";
  const startsAt = toIsoSaoPaulo(optional(formData, "starts_at"));
  const endsAt = toIsoSaoPaulo(optional(formData, "ends_at"));
  const unitId = optional(formData, "unit_id");
  const ministryId = optional(formData, "ministry_id");
  const groupId = optional(formData, "group_id");

  if (!organizationId || !title || !startsAt) {
    back("error", "Título, organização e início são obrigatórios.", organizationId);
  }

  const { error } = await supabase.from("events").insert({
    organization_id: organizationId,
    unit_id: unitId,
    ministry_id: ministryId,
    group_id: groupId,
    title,
    description: optional(formData, "description"),
    event_type: eventType,
    visibility,
    starts_at: startsAt,
    ends_at: endsAt,
    location_name: optional(formData, "location_name"),
    address_line: optional(formData, "address_line"),
    status: "scheduled",
    created_by: userId,
  });

  if (error) {
    back("error", "Não foi possível publicar. Confira escopo, público e horários.", organizationId);
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/app");
  back("ok", "Evento publicado na agenda.", organizationId);
}

export async function setEventStatus(formData: FormData) {
  const { supabase } = await authed();
  const organizationId = required(formData, "organization_id");
  const eventId = required(formData, "event_id");
  const status = required(formData, "status");

  if (!eventId || !["scheduled", "cancelled", "completed"].includes(status)) {
    back("error", "Evento ou status inválido.", organizationId);
  }

  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) back("error", "Você não pode alterar este evento.", organizationId);

  revalidatePath("/admin/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/app");
  back("ok", "Status da agenda atualizado.", organizationId);
}
