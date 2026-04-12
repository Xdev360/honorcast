import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from("event_bookings").insert([body]);
  return NextResponse.json({ ok: !error });
}

export async function GET() {
  const { data } = await supabase
    .from("event_bookings")
    .select("*")
    .order("submitted_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
