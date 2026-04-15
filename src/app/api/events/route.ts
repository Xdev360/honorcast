import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("events").select("*").order("id");
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  const dbUpdates: Record<string, unknown> = { ...updates };
  if ("spotsTotal" in dbUpdates) {
    dbUpdates.spots_total = dbUpdates.spotsTotal;
    delete dbUpdates.spotsTotal;
  }
  if ("spotsLeft" in dbUpdates) {
    dbUpdates.spots_left = dbUpdates.spotsLeft;
    delete dbUpdates.spotsLeft;
  }
  const { error } = await supabase.from("events").update(dbUpdates).eq("id", id);
  return NextResponse.json({ ok: !error, error: error?.message });
}
