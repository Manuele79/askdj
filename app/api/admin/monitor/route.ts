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

function asIso(value: unknown) {
  if (!value) return "";
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function latestIso(...values: unknown[]) {
  return values
    .map(asIso)
    .filter(Boolean)
    .sort()
    .at(-1) || "";
}

function normalizeMode(mode: unknown) {
  return String(mode || "").toLowerCase() === "jukebox" ? "jukebox" : "dj_party";
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
  const fifteenMinAgoMs = Date.now() - 15 * 60 * 1000;

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
        .select("event_code, created_at, expires_at, mode")
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),

      supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),

      supabase
        .from("events")
        .select("event_code, created_at, expires_at, mode")
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("requests")
        .select(
          "event_code, created_at, updated_at, jukebox_status, jukebox_queued_at, jukebox_played_at"
        )
        .or(
          [
            `created_at.gte.${fifteenMinAgoIso}`,
            `updated_at.gte.${fifteenMinAgoMs}`,
            `jukebox_queued_at.gte.${fifteenMinAgoIso}`,
            `jukebox_played_at.gte.${fifteenMinAgoIso}`,
          ].join(",")
        ),

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

    const recentActivityByEvent = recentRequests.reduce<
      Record<
        string,
        {
          requests_last_15_min: number;
          request_activity_last_15_min: number;
          jukebox_activity_last_15_min: number;
          last_request_activity_at: string;
          last_jukebox_activity_at: string;
          last_activity_at: string;
          jukebox_statuses: Record<string, number>;
        }
      >
    >(
      (acc, row: any) => {
        const code = String(row.event_code || "");
        const requestActivityAt = latestIso(row.created_at, row.updated_at);
        const jukeboxActivityAt = latestIso(
          row.created_at,
          row.updated_at,
          row.jukebox_queued_at,
          row.jukebox_played_at
        );

        const current =
          acc[code] ||
          {
            requests_last_15_min: 0,
            request_activity_last_15_min: 0,
            jukebox_activity_last_15_min: 0,
            last_request_activity_at: "",
            last_jukebox_activity_at: "",
            last_activity_at: "",
            jukebox_statuses: {},
          };

        current.requests_last_15_min += 1;

        if (requestActivityAt >= fifteenMinAgoIso) {
          current.request_activity_last_15_min += 1;
          current.last_request_activity_at = latestIso(
            current.last_request_activity_at,
            requestActivityAt
          );
        }

        if (jukeboxActivityAt >= fifteenMinAgoIso) {
          current.jukebox_activity_last_15_min += 1;
          current.last_jukebox_activity_at = latestIso(
            current.last_jukebox_activity_at,
            jukeboxActivityAt
          );
        }

        current.last_activity_at = latestIso(
          current.last_activity_at,
          requestActivityAt,
          jukeboxActivityAt
        );

        const jukeboxStatus = String(row.jukebox_status || "").trim();
        if (jukeboxStatus) {
          current.jukebox_statuses[jukeboxStatus] =
            (current.jukebox_statuses[jukeboxStatus] || 0) + 1;
        }

        acc[code] = current;
        return acc;
      },
      {}
    );

    const live_events = liveEventsRaw.map((event: any) => {
      const mode = normalizeMode(event.mode);
      const activity = recentActivityByEvent[event.event_code];
      const requestsLast15 = activity?.requests_last_15_min || 0;
      const inUse =
        mode === "jukebox"
          ? (activity?.jukebox_activity_last_15_min || 0) > 0
          : (activity?.request_activity_last_15_min || 0) > 0;

      return {
        code: event.event_code,
        mode,
        kind: mode,
        created_at: event.created_at,
        expires_at: event.expires_at,
        requests_last_15_min: requestsLast15,
        request_activity_last_15_min: activity?.request_activity_last_15_min || 0,
        jukebox_activity_last_15_min: activity?.jukebox_activity_last_15_min || 0,
        last_request_activity_at: activity?.last_request_activity_at || null,
        last_jukebox_activity_at: activity?.last_jukebox_activity_at || null,
        last_activity_at: activity?.last_activity_at || null,
        jukebox_statuses: mode === "jukebox" ? activity?.jukebox_statuses || {} : undefined,
        in_use: inUse,
        status: inUse ? "in_use" : "live_idle",
        monitor_status: inUse
          ? mode === "jukebox"
            ? "live_jukebox_in_use"
            : "live_dj_party_in_use"
          : mode === "jukebox"
          ? "live_jukebox_stopped"
          : "live_dj_party_idle",
      };
    });

    const recent_events = recentEventsRaw.map((event: any) => {
      const isLive = !!event.expires_at && event.expires_at > nowIso;
      const mode = normalizeMode(event.mode);
      const activity = recentActivityByEvent[event.event_code];
      const requestsLast15 = activity?.requests_last_15_min || 0;
      const inUse =
        isLive &&
        (mode === "jukebox"
          ? (activity?.jukebox_activity_last_15_min || 0) > 0
          : (activity?.request_activity_last_15_min || 0) > 0);

      return {
        code: event.event_code,
        mode,
        kind: mode,
        created_at: event.created_at,
        expires_at: event.expires_at,
        live: isLive,
        requests_last_15_min: requestsLast15,
        request_activity_last_15_min: activity?.request_activity_last_15_min || 0,
        jukebox_activity_last_15_min: activity?.jukebox_activity_last_15_min || 0,
        last_request_activity_at: activity?.last_request_activity_at || null,
        last_jukebox_activity_at: activity?.last_jukebox_activity_at || null,
        last_activity_at: activity?.last_activity_at || null,
        jukebox_statuses: mode === "jukebox" ? activity?.jukebox_statuses || {} : undefined,
        in_use: inUse,
        status: isLive
          ? inUse
            ? "in_use"
            : "live_idle"
          : "expired",
        monitor_status: !isLive
          ? "expired"
          : inUse
          ? mode === "jukebox"
            ? "live_jukebox_in_use"
            : "live_dj_party_in_use"
          : mode === "jukebox"
          ? "live_jukebox_stopped"
          : "live_dj_party_idle",
      };
    });

    const active_events = live_events.filter((e: any) => e.in_use);
    const idle_live_events = live_events.filter((e: any) => !e.in_use);
    const live_dj_party_events = live_events.filter((e: any) => e.mode === "dj_party");
    const live_jukebox_events = live_events.filter((e: any) => e.mode === "jukebox");
    const active_dj_party_events = live_dj_party_events.filter((e: any) => e.in_use);
    const active_jukebox_events = live_jukebox_events.filter((e: any) => e.in_use);
    const idle_dj_party_events = live_dj_party_events.filter((e: any) => !e.in_use);
    const idle_jukebox_events = live_jukebox_events.filter((e: any) => !e.in_use);
    const expired_recent_events = recent_events.filter((e: any) => !e.live);

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
        live_dj_party_events: live_dj_party_events.length,
        live_jukebox_events: live_jukebox_events.length,
        active_dj_party_events: active_dj_party_events.length,
        active_jukebox_events: active_jukebox_events.length,
        idle_dj_party_events: idle_dj_party_events.length,
        idle_jukebox_events: idle_jukebox_events.length,
        expired_recent_events: expired_recent_events.length,
      },

      live_events,
      active_events,
      idle_live_events,
      live_dj_party_events,
      live_jukebox_events,
      active_dj_party_events,
      active_jukebox_events,
      idle_dj_party_events,
      idle_jukebox_events,
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
