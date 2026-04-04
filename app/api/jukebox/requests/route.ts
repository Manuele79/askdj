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
    createdAt: r.created_at ? Date.parse(r.created_at) : 0,
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : 0,
  };
}

// GET /api/jukebox/requests?eventCode=XXXX
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventCode = normalizeEventCode(searchParams.get("eventCode"));

  if (!eventCode) {
    return NextResponse.json({ requests: [] });
  }

  const { data: ev, error: evErr } = await supabase
    .from("events")
    .select("event_code, expires_at, mode")
    .eq("event_code", eventCode)
    .single();

  if (evErr || !ev) {
    return NextResponse.json(
      { ok: false, error: "Evento non valido", requests: [] },
      { status: 404 }
    );
  }

  if (ev.mode !== "jukebox") {
    return NextResponse.json(
      { ok: false, error: "Evento non Jukebox", requests: [] },
      { status: 400 }
    );
  }

  const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
  if (exp && Date.now() > exp) {
    return NextResponse.json(
      { ok: false, error: "Evento scaduto", requests: [] },
      { status: 410 }
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("event_code", eventCode)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("SUPABASE JUKEBOX GET ERROR:", error);
    return NextResponse.json({ requests: [] }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    requests: (data || []).map(mapRow),
  });
}