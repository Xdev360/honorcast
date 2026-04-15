import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("events").select("*").order("id");
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body as Record<string, unknown>;
  const { error } = await supabase.from("events").update(updates).eq("id", id);
  return NextResponse.json({ ok: !error, error: error?.message });
}
