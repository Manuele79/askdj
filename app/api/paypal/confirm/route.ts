import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const eventCode = String(body.eventCode || "").trim().toUpperCase();

  if (!eventCode) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update({
      payment_status: "paid",
      paid_at: now,
    })
    .eq("event_code", eventCode);

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}