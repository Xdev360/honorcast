import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("crypto_settings")
    .select("*")
    .order("id")
    .limit(1)
    .single();
  return NextResponse.json(data ?? {});
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { data: existing } = await supabase
    .from("crypto_settings")
    .select("id")
    .limit(1)
    .single();

  if (existing?.id) {
    await supabase
      .from("crypto_settings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("crypto_settings").insert([body]);
  }

  return NextResponse.json({ ok: true });
}
