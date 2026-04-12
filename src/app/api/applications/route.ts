import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id?: number; status?: string };
  const { id, status } = body;
  if (id == null || status == null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  return NextResponse.json({ ok: !error });
}
