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

type EventRow = {
  event_code: string;
  name?: string | null;
  mode?: string | null;
  created_at: string;
  expires_at: string | null;
  paid?: boolean | null;
  tidal_connected?: boolean | null;
  tidal_playlist_id?: string | null;
};

type RequestRow = {
  event_code: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const todayIso = startOfTodayIso();
  const recentWindowIso = minutesAgoIso(15);

  try {
    const [
      createdTodayResult,
      requestsTodayResult,
      liveEventsResult,
      recentEventsResult,
      recentRequestsResult,
      tidalRowsResult,
    ] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),

      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),

      supabase
        .from("events")
        .select(
          "event_code, name, mode, created_at, expires_at, paid, tidal_connected, tidal_playlist_id"
        )
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),

      supabase
        .from("events")
        .select(
          "event_code, name, mode, created_at, expires_at, paid, tidal_connected, tidal_playlist_id"
        )
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("requests")
        .select("event_code, created_at")
        .gte("created_at", recentWindowIso),

      supabase
        .from("events")
        .select("event_code, tidal_connected, tidal_playlist_id")
        .eq("tidal_connected", true),
    ]);

    if (createdTodayResult.error) throw createdTodayResult.error;
    if (requestsTodayResult.error) throw requestsTodayResult.error;
    if (liveEventsResult.error) throw liveEventsResult.error;
    if (recentEventsResult.error) throw recentEventsResult.error;
    if (recentRequestsResult.error) throw recentRequestsResult.error;
    if (tidalRowsResult.error) throw tidalRowsResult.error;

    const liveEvents = (liveEventsResult.data ?? []) as EventRow[];
    const recentEventsRaw = (recentEventsResult.data ?? []) as EventRow[];
    const recentRequests = (recentRequestsResult.data ?? []) as RequestRow[];
    const tidalRows = tidalRowsResult.data ?? [];

    const recentRequestCountByEvent = recentRequests.reduce<Record<string, number>>(
      (acc, request) => {
        acc[request.event_code] = (acc[request.event_code] || 0) + 1;
        return acc;
      },
      {}
    );

    const live_events = liveEvents.map((event) => {
      const recentRequestsCount = recentRequestCountByEvent[event.event_code] || 0;

      return {
        code: event.event_code,
        name: event.name ?? null,
        mode: event.mode ?? null,
        created_at: event.created_at,
        expires_at: event.expires_at,
        paid: Boolean(event.paid),
        requests_last_15_min: recentRequestsCount,
        in_use: recentRequestsCount > 0,
        status: recentRequestsCount > 0 ? "in_use" : "live_idle",
      };
    });

    const recent_events = recentEventsRaw.map((event) => {
      const isLive = !!event.expires_at && event.expires_at > nowIso;
      const recentRequestsCount = recentRequestCountByEvent[event.event_code] || 0;

      return {
        code: event.event_code,
        name: event.name ?? null,
        mode: event.mode ?? null,
        created_at: event.created_at,
        expires_at: event.expires_at,
        paid: Boolean(event.paid),
        live: isLive,
        requests_last_15_min: recentRequestsCount,
        status: isLive
          ? recentRequestsCount > 0
            ? "in_use"
            : "live_idle"
          : "expired",
      };
    });

    const activeEvents = live_events.filter((event) => event.in_use);
    const idleLiveEvents = live_events.filter((event) => !event.in_use);

    const tidalConnected = tidalRows.length;
    const playlistMissing = tidalRows.filter((event: any) => !event.tidal_playlist_id).length;

    return NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),
      recommended_scan_interval_seconds: live_events.length > 0 ? 300 : 900,

      summary: {
        events_created_today: createdTodayResult.count || 0,
        requests_today: requestsTodayResult.count || 0,
        live_events: live_events.length,
        active_events: activeEvents.length,
        idle_live_events: idleLiveEvents.length,
      },

      live_events,
      active_events: activeEvents,
      idle_live_events: idleLiveEvents,
      recent_events,

      alerts: {
        inactive_events: idleLiveEvents.length,
        errors: 0,
      },

      tidal: {
        connected_events: tidalConnected,
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