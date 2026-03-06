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

function mapRow(r: any) {
  return {
    id: String(r.id),
    eventCode: String(r.event_code ?? ""),
    title: String(r.title ?? ""),
    url: String(r.url ?? ""),
    dedication: String(r.dedication ?? ""),
    platform: String(r.platform ?? "other"),
    youtubeVideoId: String(r.youtube_video_id ?? ""),
    votes: Number(r.votes ?? 0),
    bpm: r.bpm === null || r.bpm === undefined ? null : Number(r.bpm),
    createdAt: r.created_at ? Date.parse(r.created_at) : 0,
    updatedAt: Number(r.updated_at ?? 0),
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
  }

  const { data: row, error: e1 } = await supabase
    .from("requests")
    .select("id, votes, event_code")
    .eq("id", id)
    .single();

  if (e1 || !row) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const { data: ev, error: evErr } = await supabase
    .from("events")
    .select("expires_at")
    .eq("event_code", row.event_code)
    .single();

  if (evErr || !ev) {
    return NextResponse.json({ ok: false, error: "Evento non valido" }, { status: 404 });
  }

  const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
  if (exp && Date.now() > exp) {
    return NextResponse.json({ ok: false, error: "Evento scaduto" }, { status: 410 });
  }

  const newVotes = Math.max(0, Number(row.votes || 0) + 1);
  const nowMs = Date.now();

  const { data, error: e2 } = await supabase
    .from("requests")
    .update({ votes: newVotes, updated_at: nowMs })
    .eq("id", id)
    .select("*")
    .single();

  if (e2) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: mapRow(data) });
}