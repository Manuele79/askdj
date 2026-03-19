import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { eventCode } = await req.json();

    if (!eventCode) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // 1. prendi evento
    const { data: ev } = await supabase
      .from("events")
      .select("event_code, tidal_connected, tidal_user_id")
      .eq("event_code", eventCode)
      .single();

    if (!ev || !ev.tidal_connected) {
      return NextResponse.json({ ok: false, error: "Tidal non collegato" }, { status: 400 });
    }

    // 2. prendi token
    const { data: conn } = await supabase
      .from("tidal_connections")
      .select("access_token")
      .eq("tidal_user_id", ev.tidal_user_id)
      .single();

    if (!conn?.access_token) {
      return NextResponse.json({ ok: false, error: "Token mancante" }, { status: 400 });
    }

    const accessToken = conn.access_token;

    // 3. crea playlist TIDAL
    const playlistName = `AskDJ - ${eventCode}`;

    const tidalRes = await fetch("https://openapi.tidal.com/v1/playlists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: playlistName,
        description: "Playlist creata da AskDJ",
      }),
    });

    const tidalData = await tidalRes.json();

    if (!tidalRes.ok) {
      console.error(tidalData);
      return NextResponse.json({ ok: false, error: "Errore TIDAL" }, { status: 500 });
    }

    const playlistId = tidalData.id;
    const playlistUrl = `https://listen.tidal.com/playlist/${playlistId}`;

    // 4. salva su events
    await supabase
      .from("events")
      .update({
        tidal_playlist_id: playlistId,
        tidal_playlist_url: playlistUrl,
      })
      .eq("event_code", eventCode);

    return NextResponse.json({
      ok: true,
      playlistId,
      playlistUrl,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}