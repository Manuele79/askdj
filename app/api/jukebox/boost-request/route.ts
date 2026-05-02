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
  const id = String(body.requestId || "").trim();

  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // 🔐 verifica payments attivo
  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "payments_enabled")
    .single();

  const PAYMENT_REQUIRED = setting?.value === "true";

  if (!PAYMENT_REQUIRED) {
    return NextResponse.json({ ok: false, error: "Boost disabilitato" }, { status: 403 });
  }

  // 🔍 prendi richiesta
  const { data: row, error } = await supabase
    .from("requests")
    .select("id, event_code, jukebox_status")
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // deve essere pending
  if (row.jukebox_status !== "pending") {
    return NextResponse.json({ ok: false, error: "Non boostabile" }, { status: 400 });
  }

  // 🔍 verifica evento jukebox
  const { data: ev } = await supabase
    .from("events")
    .select("mode")
    .eq("event_code", row.event_code)
    .single();

  if (!ev || ev.mode !== "jukebox") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // 🚀 BOOST
  const { error: updErr } = await supabase
    .from("requests")
    .update({
     priority: 1,
    })
    .eq("id", id);

  if (updErr) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}