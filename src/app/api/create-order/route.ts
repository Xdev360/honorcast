import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function fallbackOrderId() {
  return (
    "HC-" +
    [1, 2, 3]
      .map(() =>
        Math.random().toString(36).substring(2, 6).toUpperCase(),
      )
      .join("-")
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { items?: unknown[] };
    const { items } = body;
    if (!items?.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          items,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({
        orderId: fallbackOrderId(),
        fallback: true,
      });
    }
    return NextResponse.json({ orderId: data.id, fallback: false });
  } catch {
    return NextResponse.json({
      orderId: fallbackOrderId(),
      fallback: true,
    });
  }
}
