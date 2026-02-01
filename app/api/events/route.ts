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

function normalizeEventCode(code: any) {
  return String(code || "").trim().toUpperCase();
}

async function checkCreatePassword(provided: any) {
  const pass = String(provided || "").trim();
  if (!pass) return false;

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "create_event_password")
    .single();

  if (error || !data?.value) return false;
  return pass === String(data.value);
}

// GET /api/events?eventCode=XXXX  (serve per "entra evento esistente")
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventCode = normalizeEventCode(searchParams.get("eventCode"));

  if (!eventCode) {
    return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
  }

  const { data: ev, error } = await supabase
    .from("events")
    .select("event_code, expires_at")
    .eq("event_code", eventCode)
    .single();

  if (error || !ev) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
  if (exp && Date.now() > exp) {
    return NextResponse.json({ ok: false, error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({ ok: true, eventCode: ev.event_code, expiresAt: ev.expires_at });
}

// POST /api/events body: { eventCode, password }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const eventCode = normalizeEventCode(body.eventCode);
  const password = body.password;

  if (!eventCode) {
    return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
  }

  const okPass = await checkCreatePassword(password);
  if (!okPass) {
    return NextResponse.json({ ok: false, error: "Password errata" }, { status: 401 });
  }

  // 1) controllo se esiste già
  const { data: existing, error: exErr } = await supabase
    .from("events")
    .select("event_code, expires_at")
    .eq("event_code", eventCode)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  const exTs = existing?.expires_at ? Date.parse(existing.expires_at) : 0;
  const isActive = existing && exTs && Date.now() <= exTs;

  // se esiste ed è attivo -> BLOCCO
  if (isActive) {
    return NextResponse.json(
      { ok: false, error: "Already active" },
      { status: 409 }
    );
  }

  // 2) crea (o resetta se scaduto) scadenza a 12h da ora
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("events")
    .upsert(
      { event_code: eventCode, expires_at: expiresAt },
      { onConflict: "event_code" }
    )
    .select("event_code, created_at, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eventCode: data.event_code, expiresAt: data.expires_at });
}
