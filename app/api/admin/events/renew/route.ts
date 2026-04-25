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

function addDuration(base: Date, mode: string, duration: string | null) {
  const d = new Date(base);

  if (mode === "dj_party") {
    d.setHours(d.getHours() + 12);
    return d;
  }

  if (mode === "jukebox") {
    if (duration === "1m") {
      d.setMonth(d.getMonth() + 1);
      return d;
    }

    if (duration === "1y") {
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }

    d.setDate(d.getDate() + 1);
    return d;
  }

  throw new Error("Modalità evento non valida");
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const expected = `Bearer ${env("ADMIN_TOKEN")}`;

    if (auth !== expected) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const eventCode = String(body.eventCode || "").trim().toUpperCase();
    const requestedDuration = body.duration ? String(body.duration) : null;

    if (!eventCode) {
      return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
    }

    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("event_code, mode, duration, expires_at")
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, error: "Evento non trovato" }, { status: 404 });
    }

    const now = new Date();
    const currentExpires = ev.expires_at ? new Date(ev.expires_at) : null;

    const base =
      currentExpires && currentExpires.getTime() > now.getTime()
        ? currentExpires
        : now;

    const finalDuration =
      ev.mode === "jukebox"
        ? requestedDuration || ev.duration || "1d"
        : null;

    const newExpiresAt = addDuration(base, ev.mode, finalDuration).toISOString();

    const { error: upErr } = await supabase
      .from("events")
      .update({
        expires_at: newExpiresAt,
        payment_status: "paid",
        paid_at: now.toISOString(),
        duration: ev.mode === "jukebox" ? finalDuration : ev.duration,
      })
      .eq("event_code", eventCode);

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: "Errore aggiornamento rinnovo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      eventCode,
      mode: ev.mode,
      duration: finalDuration,
      oldExpiresAt: ev.expires_at,
      newExpiresAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}