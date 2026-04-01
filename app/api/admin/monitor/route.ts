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

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const todayIso = startOfTodayIso();
  const fifteenMinAgoIso = minutesAgoIso(15);

  try {
    // 1) Eventi creati oggi
    const { count: createdToday, error: createdTodayError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso);

    if (createdTodayError) throw createdTodayError;

    // 2) Eventi live (non scaduti)
    const { count: liveEvents, error: liveEventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", nowIso);

    if (liveEventsError) throw liveEventsError;

    // 3) Richieste di oggi
    const { count: requestsToday, error: requestsTodayError } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso);

    if (requestsTodayError) throw requestsTodayError;

    // 4) Ultimi 5 eventi creati
    const { data: recentEventsRaw, error: recentEventsError } = await supabase
      .from("events")
      .select("event_code, created_at, expires_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentEventsError) throw recentEventsError;

    const recentEventCodes = (recentEventsRaw || []).map((e) => e.event_code);

    let requestsByEvent: Record<string, number> = {};

    if (recentEventCodes.length > 0) {
      const { data: recentRequests, error: recentRequestsError } = await supabase
        .from("requests")
        .select("event_code")
        .in("event_code", recentEventCodes);

      if (recentRequestsError) throw recentRequestsError;

      requestsByEvent = (recentRequests || []).reduce((acc: Record<string, number>, row: any) => {
        const code = row.event_code;
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
    }

    const recent_events = (recentEventsRaw || []).map((e) => ({
      code: e.event_code,
      created_at: e.created_at,
      expires_at: e.expires_at,
      requests: requestsByEvent[e.event_code] || 0,
    }));

    // 5) Alert: eventi live ma fermi
    // evento live + creato da almeno 15 min + nessuna richiesta ultimi 15 min
    const { data: liveEventsRaw, error: liveEventsRawError } = await supabase
      .from("events")
      .select("event_code, created_at")
      .gt("expires_at", nowIso)
      .lte("created_at", fifteenMinAgoIso);

    if (liveEventsRawError) throw liveEventsRawError;

    const liveCodes = (liveEventsRaw || []).map((e) => e.event_code);

    let activeRecentRequestCodes = new Set<string>();

    if (liveCodes.length > 0) {
      const { data: recentActiveRequests, error: recentActiveRequestsError } = await supabase
        .from("requests")
        .select("event_code")
        .in("event_code", liveCodes)
        .gte("created_at", fifteenMinAgoIso);

      if (recentActiveRequestsError) throw recentActiveRequestsError;

      activeRecentRequestCodes = new Set(
        (recentActiveRequests || []).map((r: any) => r.event_code)
      );
    }

    const inactiveEventsCount = (liveEventsRaw || []).filter(
      (e) => !activeRecentRequestCodes.has(e.event_code)
    ).length;

    // 6) TIDAL
    const { count: tidalConnected, error: tidalConnectedError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("tidal_connected", true);

    if (tidalConnectedError) throw tidalConnectedError;

    const { data: tidalConnectedRows, error: tidalPlaylistMissingError } = await supabase
      .from("events")
      .select("event_code, tidal_playlist_id")
      .eq("tidal_connected", true);

    if (tidalPlaylistMissingError) throw tidalPlaylistMissingError;

    const playlistMissing = (tidalConnectedRows || []).filter(
      (e: any) => !e.tidal_playlist_id
    ).length;

    return NextResponse.json({
      events: {
        created_today: createdToday || 0,
        live: liveEvents || 0,
      },
      requests: {
        today: requestsToday || 0,
      },
      recent_events,
      alerts: {
        inactive_events: inactiveEventsCount,
        errors: 0,
      },
      tidal: {
        connected_events: tidalConnected || 0,
        playlist_missing: playlistMissing,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}