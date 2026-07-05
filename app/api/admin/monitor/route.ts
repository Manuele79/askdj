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

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const adminToken = process.env.ADMIN_TOKEN;
  return !!authHeader && !!adminToken && authHeader === `Bearer ${adminToken}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const todayIso = startOfTodayIso();
  const fifteenMinAgoIso = minutesAgoIso(15);

  try {
    const [
      createdTodayResult,
      liveEventsResult,
      requestsTodayResult,
      recentEventsResult,
      recentRequestsResult,
      tidalRowsResult,
    ] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),

      supabase
        .from("events")
        .select("event_code, created_at, expires_at")
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),

      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),

      supabase
        .from("events")
        .select("event_code, created_at, expires_at")
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("requests")
        .select("event_code, created_at")
        .gte("created_at", fifteenMinAgoIso),

      supabase
        .from("events")
        .select("event_code, tidal_playlist_id")
        .eq("tidal_connected", true),
    ]);

    if (createdTodayResult.error) throw createdTodayResult.error;
    if (liveEventsResult.error) throw liveEventsResult.error;
    if (requestsTodayResult.error) throw requestsTodayResult.error;
    if (recentEventsResult.error) throw recentEventsResult.error;
    if (recentRequestsResult.error) throw recentRequestsResult.error;
    if (tidalRowsResult.error) throw tidalRowsResult.error;

    const liveEventsRaw = liveEventsResult.data || [];
    const recentEventsRaw = recentEventsResult.data || [];
    const recentRequests = recentRequestsResult.data || [];
    const tidalRows = tidalRowsResult.data || [];

    const recentRequestsByEvent = recentRequests.reduce<Record<string, number>>(
      (acc, row: any) => {
        acc[row.event_code] = (acc[row.event_code] || 0) + 1;
        return acc;
      },
      {}
    );

    const live_events = liveEventsRaw.map((event: any) => {
      const requestsLast15 = recentRequestsByEvent[event.event_code] || 0;

      return {
        code: event.event_code,
        created_at: event.created_at,
        expires_at: event.expires_at,
        requests_last_15_min: requestsLast15,
        in_use: requestsLast15 > 0,
        status: requestsLast15 > 0 ? "in_use" : "live_idle",
      };
    });

    const recent_events = recentEventsRaw.map((event: any) => {
      const isLive = !!event.expires_at && event.expires_at > nowIso;
      const requestsLast15 = recentRequestsByEvent[event.event_code] || 0;

      return {
        code: event.event_code,
        created_at: event.created_at,
        expires_at: event.expires_at,
        live: isLive,
        requests_last_15_min: requestsLast15,
        status: isLive
          ? requestsLast15 > 0
            ? "in_use"
            : "live_idle"
          : "expired",
      };
    });

    const active_events = live_events.filter((e: any) => e.in_use);
    const idle_live_events = live_events.filter((e: any) => !e.in_use);

    const playlistMissing = tidalRows.filter((e: any) => !e.tidal_playlist_id).length;

    return NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),

      // Compatibilità vecchio monitor HA
      events: {
        created_today: createdTodayResult.count || 0,
        live: live_events.length,
      },
      requests: {
        today: requestsTodayResult.count || 0,
      },

      // Nuovo monitor più utile
      summary: {
        events_created_today: createdTodayResult.count || 0,
        requests_today: requestsTodayResult.count || 0,
        live_events: live_events.length,
        active_events: active_events.length,
        idle_live_events: idle_live_events.length,
      },

      live_events,
      active_events,
      idle_live_events,
      recent_events,

      alerts: {
        inactive_events: idle_live_events.length,
        errors: 0,
      },

      tidal: {
        connected_events: tidalRows.length,
        playlist_missing: playlistMissing,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}