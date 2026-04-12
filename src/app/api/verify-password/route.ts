import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };
  let correct = process.env.SITE_PASSWORD ?? "CAST";
  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site_password")
      .single();
    if (data?.value) correct = String(data.value);
  } catch {
    /* use default */
  }
  const valid =
    String(password ?? "")
      .trim()
      .toUpperCase() === correct.trim().toUpperCase();
  return NextResponse.json({ valid });
}
