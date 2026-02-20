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

function makeDemoCode() {
  const s = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEMO-${s}`;
}

// POST /api/demo  -> crea evento demo 20 min e ritorna eventCode
export async function POST() {
  const eventCode = makeDemoCode();
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("events")
    .insert({ event_code: eventCode, expires_at: expiresAt })
    .select("event_code, expires_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eventCode: data.event_code, expiresAt: data.expires_at });
}