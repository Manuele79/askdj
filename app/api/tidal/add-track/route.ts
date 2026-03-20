import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { eventCode, trackId } = await req.json();

    if (!eventCode || !trackId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // 1. prendi evento
    const { data: ev } = await supabase
      .from("events")
      .select("tidal_user_id, tidal_playlist_id")
      .eq("event_code", eventCode)
      .single();

    if (!ev?.tidal_playlist_id) {
      return NextResponse.json(
        { ok: false, error: "Playlist mancante" },
        { status: 400 }
      );
    }

    // 2. prendi token
    const { data: conn } = await supabase
      .from("tidal_connections")
      .select("access_token")
      .eq("tidal_user_id", ev.tidal_user_id)
      .single();

    if (!conn?.access_token) {
      return NextResponse.json(
        { ok: false, error: "Token mancante" },
        { status: 400 }
      );
    }

    const accessToken = conn.access_token;

    // 3. aggiungi track
    const tidalRes = await fetch(
      `https://openapi.tidal.com/v2/playlists/${ev.tidal_playlist_id}/relationships/items`,
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
              id: String(trackId),
            },
          ],
        }),
      }
    );

    const rawText = await tidalRes.text();
    console.log("ADD TRACK STATUS:", tidalRes.status);
    console.log("ADD TRACK RESPONSE:", rawText);

    if (!tidalRes.ok) {
      return NextResponse.json(
        { ok: false, error: rawText },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}