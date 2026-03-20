import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeEventCode(code: any) {
  return String(code || "").trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = normalizeEventCode(body.eventCode);
    const trackId = String(body.trackId || "").trim();

    if (!eventCode || !trackId) {
      return NextResponse.json(
        { ok: false, error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    // 1. prendi evento
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("tidal_user_id, tidal_playlist_id")
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev?.tidal_playlist_id) {
      return NextResponse.json(
        { ok: false, error: "Playlist mancante" },
        { status: 400 }
      );
    }

    // 2. prendi token
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
    const playlistId = ev.tidal_playlist_id;

    // 3. leggi brani già presenti in playlist
    const existingRes = await fetch(
      `https://openapi.tidal.com/v2/playlists/${playlistId}/relationships/items`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const existingRaw = await existingRes.text();
    console.log("GET PLAYLIST ITEMS STATUS:", existingRes.status);
    console.log("GET PLAYLIST ITEMS RESPONSE:", existingRaw);

    let existingData: any = null;
    try {
      existingData = existingRaw ? JSON.parse(existingRaw) : null;
    } catch {
      existingData = existingRaw;
    }

    if (!existingRes.ok) {
      return NextResponse.json(
        { ok: false, error: existingData || "Errore lettura playlist" },
        { status: 500 }
      );
    }

    const existingIds = Array.isArray(existingData?.data)
      ? existingData.data
          .map((item: any) => String(item?.id || ""))
          .filter(Boolean)
      : [];

    // 4. se esiste già, non aggiungerlo
    if (existingIds.includes(trackId)) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        playlistId,
        trackId,
      });
    }

    // 5. aggiungi track
    const tidalRes = await fetch(
      `https://openapi.tidal.com/v2/playlists/${playlistId}/relationships/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: [
            {
              type: "tracks",
              id: trackId,
            },
          ],
        }),
      }
    );

    const rawText = await tidalRes.text();
    console.log("ADD TRACK STATUS:", tidalRes.status);
    console.log("ADD TRACK RESPONSE:", rawText);

    let tidalData: any = null;
    try {
      tidalData = rawText ? JSON.parse(rawText) : null;
    } catch {
      tidalData = rawText;
    }

    if (!tidalRes.ok) {
      return NextResponse.json(
        { ok: false, error: tidalData || rawText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyExists: false,
      playlistId,
      trackId,
    });
  } catch (err: any) {
    console.error("ADD TRACK ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}