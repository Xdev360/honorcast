/*
  Run this in Supabase SQL Editor to support flexible form fields:

  create table if not exists form_responses (
    id serial primary key,
    order_id text,
    category_label text,
    field_label text,
    field_type text,
    value text,
    submitted_at timestamp default now()
  );

  -- Index for fast lookup by order
  create index if not exists form_responses_order_idx on form_responses(order_id);

  -- Also add a form_data jsonb column to applications for storing all answers together:
  alter table applications add column if not exists form_data jsonb;
*/

import { supabase } from "./supabase";

// ─── PRODUCTS ─────────────────────────────────────────────

export async function getProducts() {
  const { data } = await supabase.from("products").select("*").order("id");
  return data ?? [];
}

export async function updateProduct(
  id: number,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id);
  return !error;
}

export async function uploadProductImage(id: number, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("honorculture")
    .upload(path, file, { upsert: true });
  if (uploadError) return null;
  const { data } = supabase.storage.from("honorculture").getPublicUrl(path);
  await supabase
    .from("products")
    .update({ image_url: data.publicUrl })
    .eq("id", id);
  return data.publicUrl;
}

// ─── EVENTS ───────────────────────────────────────────────

export async function getEvents() {
  const { data } = await supabase.from("events").select("*").order("id");
  return data ?? [];
}

export async function saveEvents(events: Record<string, unknown>[]) {
  const { error } = await supabase
    .from("events")
    .upsert(events, { onConflict: "id" });
  return !error;
}

export async function updateEvent(
  id: number,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id);
  return !error;
}

export async function uploadEventImage(id: number, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `events/${id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("honorculture")
    .upload(path, file, { upsert: true });
  if (uploadError) return null;
  const { data } = supabase.storage.from("honorculture").getPublicUrl(path);
  await supabase
    .from("events")
    .update({ image_url: data.publicUrl })
    .eq("id", id);
  return data.publicUrl;
}

// ─── APPLICATIONS ─────────────────────────────────────────

export async function getApplications() {
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function updateApplicationStatus(id: number, status: string) {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  return !error;
}

export async function submitApplication(
  formData: Record<string, unknown>,
  orderId: string,
) {
  const { error } = await supabase
    .from("applications")
    .insert([{ ...formData, order_id: orderId }]);
  return !error;
}

export async function uploadApplicationFile(
  orderId: string,
  file: File,
  type: "photo" | "video",
) {
  const ext = file.name.split(".").pop() ?? (type === "photo" ? "jpg" : "mp4");
  const path = `applications/${orderId}-${type}.${ext}`;
  const { error } = await supabase.storage
    .from("honorculture")
    .upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("honorculture").getPublicUrl(path);
  return data.publicUrl;
}

// ─── FORM BUILDER ─────────────────────────────────────────

export async function getFormCategories() {
  const { data } = await supabase
    .from("form_categories")
    .select("*, form_fields(*)")
    .order("position");
  return data ?? [];
}

export async function createFormCategory(label: string, position: number) {
  const { data, error } = await supabase
    .from("form_categories")
    .insert([{ label, position }])
    .select()
    .single();
  return error ? null : data;
}

export async function updateFormCategory(id: number, label: string) {
  await supabase.from("form_categories").update({ label }).eq("id", id);
}

export async function deleteFormCategory(id: number) {
  await supabase.from("form_categories").delete().eq("id", id);
}

export async function createFormField(
  categoryId: number,
  field: Record<string, unknown>,
  position: number,
) {
  const { data, error } = await supabase
    .from("form_fields")
    .insert([{ ...field, category_id: categoryId, position }])
    .select()
    .single();
  return error ? null : data;
}

export async function updateFormField(
  id: number,
  field: Record<string, unknown>,
) {
  await supabase.from("form_fields").update(field).eq("id", id);
}

export async function deleteFormField(id: number) {
  await supabase.from("form_fields").delete().eq("id", id);
}

// ─── TEAM APPLICATIONS ────────────────────────────────────

export async function submitTeamApplication(data: Record<string, unknown>) {
  try {
    const res = await fetch("/api/team-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const j = (await res.json()) as { ok?: boolean };
    return j.ok === true;
  } catch {
    const { error } = await supabase.from("team_applications").insert([data]);
    return !error;
  }
}

export async function getTeamApplications() {
  const { data } = await supabase
    .from("team_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

// ─── EVENT BOOKINGS ───────────────────────────────────────

export async function submitEventBooking(data: Record<string, unknown>) {
  try {
    const res = await fetch("/api/event-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const j = (await res.json()) as { ok?: boolean };
    return j.ok === true;
  } catch {
    const { error } = await supabase.from("event_bookings").insert([data]);
    return !error;
  }
}

export async function submitFormResponse(
  orderId: string,
  categoryLabel: string,
  fieldLabel: string,
  fieldType: string,
  value: string,
) {
  const { error } = await supabase.from("form_responses").insert([
    {
      order_id: orderId,
      category_label: categoryLabel,
      field_label: fieldLabel,
      field_type: fieldType,
      value: String(value),
      submitted_at: new Date().toISOString(),
    },
  ]);
  return !error;
}

export async function getFormResponsesByOrder(orderId: string) {
  const { data } = await supabase
    .from("form_responses")
    .select("*")
    .eq("order_id", orderId)
    .order("submitted_at");
  return data ?? [];
}

export async function getEventBookings() {
  const { data } = await supabase
    .from("event_bookings")
    .select("*")
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

// ─── SETTINGS ─────────────────────────────────────────────

export async function getSetting(key: string) {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function updateSetting(key: string, value: string) {
  await supabase.from("settings").upsert(
    { key, value },
    { onConflict: "key" },
  );
}

// ─── ORDERS ───────────────────────────────────────────────

export async function createOrder(items: unknown[]) {
  const { data, error } = await supabase
    .from("orders")
    .insert([{ items, status: "pending" }])
    .select()
    .single();
  return error ? null : data;
}

export async function verifyOrderId(orderId: string) {
  const { data } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();
  if (!data) return { valid: false as const, reason: "not_found" as const };
  if (data.status === "applied")
    return { valid: false as const, reason: "already_used" as const };
  return { valid: true as const };
}
