import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("products").select("*").order("id");
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  const { id, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };
  if ("is_new" in updates && !("new" in updates)) {
    updates.new = updates.is_new;
    delete updates.is_new;
  }
  const { error } = await supabase.from("products").update(updates).eq("id", id);
  return NextResponse.json({ ok: !error, error: error?.message });
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "Invalid product id" }, { status: 400 });
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  return NextResponse.json({ ok: !error, error: error?.message });
}
