import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractTidalTrackId(link: string): string | null {
  const m = String(link || "").match(/track\/(\d+)/);
  return m?.[1] || null;
}

function normalizeEventCode(code: any) {
  return String(code || "").trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const { links, eventCode } = await req.json();

    if (!links || !Array.isArray(links)) {
      return NextResponse.json({ ok: false, error: "Links mancanti" }, { status: 400 });
    }

    let accessToken: string | null = null;

    // Se arriva eventCode, prova a usare il token collegato a quell’evento
    if (eventCode) {
      const code = normalizeEventCode(eventCode);

      const { data: ev } = await supabase
        .from("events")
        .select("tidal_user_id")
        .eq("event_code", code)
        .single();

      if (ev?.tidal_user_id) {
        const { data: conn } = await supabase
          .from("tidal_connections")
          .select("access_token")
          .eq("tidal_user_id", ev.tidal_user_id)
          .single();

        accessToken = conn?.access_token ?? null;
      }
    }

    // Fallback: primo token disponibile
    if (!accessToken) {
      const { data: firstConn } = await supabase
        .from("tidal_connections")
        .select("access_token")
        .limit(1)
        .single();

      accessToken = firstConn?.access_token ?? null;
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Nessun token TIDAL disponibile" },
        { status: 400 }
      );
    }

    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    for (const rawLink of links) {
      const link = String(rawLink || "").trim();
      const trackId = extractTidalTrackId(link);

      if (!trackId) {
        errors++;
        errorDetails.push({ link, error: "Track ID non trovato" });
        continue;
      }

      // Skip se già esiste
      const { data: existing, error: checkErr } = await supabase
        .from("music_library")
        .select("tidal_track_id")
        .eq("tidal_track_id", trackId)
        .limit(1);

      if (checkErr) {
        errors++;
        errorDetails.push({ link, trackId, error: "DB check error" });
        continue;
      }

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      // Chiamata TIDAL
      const tidalRes = await fetch(`https://openapi.tidal.com/v2/tracks/${trackId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      });

      const rawText = await tidalRes.text();

      let tidalData: any = null;
      try {
        tidalData = rawText ? JSON.parse(rawText) : null;
      } catch {
        tidalData = rawText;
      }

      if (!tidalRes.ok) {
        errors++;
        errorDetails.push({
          link,
          trackId,
          error: `TIDAL status ${tidalRes.status}`,
          details: tidalData,
        });
        continue;
      }

      const title =
        tidalData?.data?.attributes?.title ||
        tidalData?.data?.attributes?.name ||
        null;

      const artist =
        tidalData?.data?.relationships?.artists?.data?.[0]?.id
          ? null // per ora fallback nullo se non leggiamo nome artista già pronto
          : tidalData?.data?.attributes?.artist ||
            tidalData?.data?.attributes?.artistName ||
            null;

      const album =
        tidalData?.data?.attributes?.album ||
        tidalData?.data?.attributes?.albumTitle ||
        null;

      const { error: insertErr } = await supabase
        .from("music_library")
        .upsert(
          {
            title,
            artist,
            tidal_url: link,
            tidal_track_id: trackId,
            source: "bulk_seed",
            playlist_name: album,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tidal_track_id" }
        );

      if (insertErr) {
        errors++;
        errorDetails.push({
          link,
          trackId,
          error: "Insert error",
          details: insertErr.message,
        });
        continue;
      }

      inserted++;
    }

    return NextResponse.json({
      ok: true,
      processed: links.length,
      inserted,
      skipped,
      errors,
      errorDetails,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}