import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizeEventCode(code: any) {
  return String(code || "").trim().toUpperCase();
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = normalizeEventCode(body.eventCode);

    if (!eventCode) {
      return NextResponse.json(
        { ok: false, error: "Missing eventCode" },
        { status: 400 }
      );
    }

    // 1) Prendi evento
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select(
        "event_code, tidal_connected, tidal_user_id, tidal_playlist_id, tidal_playlist_url"
      )
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev) {
      return NextResponse.json(
        { ok: false, error: "Evento non trovato" },
        { status: 404 }
      );
    }

    if (!ev.tidal_connected || !ev.tidal_user_id) {
      return NextResponse.json(
        { ok: false, error: "TIDAL non collegato" },
        { status: 400 }
      );
    }

    // Se esiste già una playlist, non ricrearla
    if (ev.tidal_playlist_id && ev.tidal_playlist_url) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        playlistId: ev.tidal_playlist_id,
        playlistUrl: ev.tidal_playlist_url,
      });
    }

    // 2) Prendi token
    const { data: conn, error: connErr } = await supabase
      .from("tidal_connections")
      .select("access_token")
      .eq("tidal_user_id", ev.tidal_user_id)
      .single();

    if (connErr || !conn?.access_token) {
      return NextResponse.json(
        { ok: false, error: "Token mancante" },
        { status: 400 }
      );
    }

    const accessToken = conn.access_token;
    const playlistName = `AskDJ - ${eventCode}`;

    // 3) Crea playlist TIDAL
    const tidalRes = await fetch("https://openapi.tidal.com/v2/playlists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "playlists",
          attributes: {
            name: playlistName,
            description: `Playlist evento ${eventCode} creata da AskDJ`,
            accessType: "PUBLIC",
          },
        },
      }),
    });

    const rawText = await tidalRes.text();
    console.log("TIDAL STATUS:", tidalRes.status);
    console.log("TIDAL RAW RESPONSE:", rawText);

    let tidalData: any = null;
    try {
      tidalData = rawText ? JSON.parse(rawText) : null;
    } catch {
      tidalData = rawText;
    }

    if (!tidalRes.ok) {
      console.error("TIDAL CREATE PLAYLIST ERROR:", tidalData);
      return NextResponse.json(
        {
          ok: false,
          error:
            tidalData?.errors ||
            tidalData?.error ||
            `TIDAL status ${tidalRes.status}`,
          details: tidalData,
        },
        { status: 500 }
      );
    }

    const playlistId = tidalData?.data?.id || null;

    if (!playlistId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Playlist creata ma id non trovato nella risposta TIDAL",
          details: tidalData,
        },
        { status: 500 }
      );
    }

    const playlistUrl = `https://listen.tidal.com/playlist/${playlistId}`;

    // 4) Salva su events
    const { error: saveErr } = await supabase
      .from("events")
      .update({
        tidal_playlist_id: String(playlistId),
        tidal_playlist_url: playlistUrl,
      })
      .eq("event_code", eventCode);

    if (saveErr) {
      console.error("SUPABASE SAVE PLAYLIST ERROR:", saveErr);
      return NextResponse.json(
        { ok: false, error: "Playlist creata ma non salvata su events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      playlistId: String(playlistId),
      playlistUrl,
    });
  } catch (err: any) {
    console.error("CREATE PLAYLIST ERROR:", err);
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.message || err || "unknown error"),
      },
      { status: 500 }
    );
  }
}