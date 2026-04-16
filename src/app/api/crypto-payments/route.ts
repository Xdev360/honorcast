import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (ref) {
    const { data } = await supabase
      .from("crypto_payments")
      .select("*")
      .eq("reference", ref)
      .single();
    return NextResponse.json(data ?? null);
  }

  const { data } = await supabase
    .from("crypto_payments")
    .select("*")
    .order("submitted_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ref =
    "HC-PAY-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 4).toUpperCase();
  const { data, error } = await supabase
    .from("crypto_payments")
    .insert([{ ...body, reference: ref, status: "pending" }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reference: data.reference });
}

export async function PATCH(req: NextRequest) {
  const { reference, status, admin_note, customer_gmail } = await req.json();
  const updates: Record<string, unknown> = { status };
  if (admin_note) updates.admin_note = admin_note;
  if (customer_gmail) updates.customer_gmail = customer_gmail;
  if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
  if (status === "rejected") updates.rejected_at = new Date().toISOString();
  const { error } = await supabase
    .from("crypto_payments")
    .update(updates)
    .eq("reference", reference);
  return NextResponse.json({ ok: !error, error: error?.message });
}
