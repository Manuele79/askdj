import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


// --- SIMPLE IN-MEMORY RATE LIMIT (good as first shield on Vercel) ---
const _rl = (globalThis as any).__dj_rl || new Map<string, number>();
(globalThis as any).__dj_rl = _rl;

function getClientIp(req: Request) {
  // Vercel/Proxies
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || "unknown";
}

function rateLimitOr429(key: string, windowMs: number) {
  const now = Date.now();
  const last = _rl.get(key) || 0;
  if (now - last < windowMs) {
    const retryAfterSec = Math.ceil((windowMs - (now - last)) / 1000);
    return NextResponse.json(
      { ok: false, error: "Too Many Requests", retryAfterSec },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "Cache-Control": "no-store",
        },
      }
    );
  }
  _rl.set(key, now);
  return null;
}


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
function apiSecretOk(req: Request) {
  const secret = process.env.API_SECRET;
  if (!secret) return true;
  const got = req.headers.get("x-api-secret") || "";
  return got === secret;
}

function requireSecret(req: Request) {
  if (!apiSecretOk(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
function extractFirstUrl(s: string): string {
  const m = (s || "").match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : "";
}

function stripUrlFromText(s: string, url: string): string {
  return (s || "").replace(url, "").replace(/\s+/g, " ").trim();
}




function extractYouTubeVideoId(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return u.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];

      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {}
  return "";
}

function detectPlatform(urlStr: string) {
  const u = (urlStr || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("spotify.com")) return "spotify";
  if (u.includes("music.apple.com") || u.includes("itunes.apple.com")) return "apple";
  if (u.includes("music.amazon") || u.includes("amazon.")) return "amazon";
  if (u.includes("tidal.com")) return "tidal";

  return "other";
}

// ---- server-side title resolver (no CORS) ----
async function fetchJsonWithTimeout(url: string, ms = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        accept: "application/json,text/plain,*/*",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchTextWithTimeout(url: string, ms = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { accept: "text/html,*/*" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractOgTitle(html: string) {
  const m =
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/name=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  return m?.[1]?.trim() || "";
}


async function resolveTitleServer(title: string, url: string, platform: string) {
  const t = (title || "").trim();
  const u = (url || "").trim();
  if (!u) return t || "Richiesta";

  const looksGeneric =
    !t ||
    t.toLowerCase() === "richiesta" ||
    t.toLowerCase() === "richiesta youtube" ||
    t.toLowerCase() === "richiesta spotify" ||
    t.toLowerCase() === "richiesta apple music" ||
    t.toLowerCase() === "richiesta tidal" ||
    t.toLowerCase() === "richiesta amazon music";

  if (!looksGeneric) return t;

  if (platform === "youtube") {
    const data = await fetchJsonWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`
    );
    const ot = data?.title ? String(data.title).trim() : "";
    return ot || "Richiesta YouTube";
  }

  if (platform === "spotify") {
    const data = await fetchJsonWithTimeout(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}`
    );
    const ot = data?.title ? String(data.title).trim() : "";
    return ot || "Richiesta Spotify";
  }

   if (platform === "tidal") {
  const html = await fetchTextWithTimeout(u);
  const ot = html ? extractOgTitle(html) : "";
  const cleaned = ot
    .replace(/\s*\|\s*TIDAL\s*$/i, "")
    .replace(/\s*-\s*TIDAL\s*$/i, "")
    .trim();
  return cleaned || "Richiesta TIDAL";
}


  if (platform === "apple") return "Richiesta Apple Music";
  if (platform === "amazon") return "Richiesta Amazon Music";

  return "Richiesta";
}

// Mappa Supabase (snake_case) -> frontend (camelCase)
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
    tidal_url: r.tidal_url ?? null,
    tidal_selected: !!r.tidal_selected,
    tidal_synced: !!r.tidal_synced,
    bpm: r.bpm === null || r.bpm === undefined ? null : Number(r.bpm), 
    createdAt: r.created_at ? Date.parse(r.created_at) : 0,
    updatedAt: Number(r.updated_at ?? 0),
  };
}

// GET /api/requests?eventCode=XXXX
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventCode = normalizeEventCode(searchParams.get("eventCode"));

  if (!eventCode) return NextResponse.json({ requests: [] });

    // evento deve esistere ed essere non scaduto (anche per GET)
  const { data: ev, error: evErr } = await supabase
    .from("events")
    .select("event_code, expires_at")
    .eq("event_code", eventCode)
    .single();

  if (evErr || !ev) {
    return NextResponse.json({ ok: false, error: "Evento non valido", requests: [] }, { status: 404 });
  }

  const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
  if (exp && Date.now() > exp) {
    return NextResponse.json({ ok: false, error: "Evento scaduto", requests: [] }, { status: 410 });
  }

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("event_code", eventCode)
    .gte("created_at", twelveHoursAgo)
    .order("votes", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("SUPABASE GET ERROR:", error);
    return NextResponse.json({ requests: [] }, { status: 500 });
  }

  return NextResponse.json({ requests: (data || []).map(mapRow) });
}

function appendDedication(existing: string, incoming: string) {
  const oldText = String(existing || "").trim();
  const newText = String(incoming || "").trim();

  if (!newText) return oldText;

  const formattedNew = `❤️ ${newText}`;

  if (!oldText) return formattedNew;

  return `${oldText}\n${formattedNew}`;
}

// POST /api/requests  body: { eventCode, title, url }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const eventCode = normalizeEventCode(body.eventCode);
  const title = String(body.title || "").trim();
  const url = String(body.url || body.youtubeUrl || "").trim();
  const dedication = String(body.dedication || "").trim().slice(0, 180);

  const ip = getClientIp(req);
  const denied = rateLimitOr429(`post:${ip}:${eventCode}`, 10000);
  if (denied) return denied;

  if (!eventCode || (!title && !url)) {
    return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
  }

  const isDemo = eventCode.startsWith("DEMO-");
  const { data: paymentSetting } = await supabase
  .from("settings")
  .select("value")
  .eq("key", "payments_enabled")
  .single();

const PAYMENT_REQUIRED = paymentSetting?.value === "true";

  // evento deve esistere ed essere non scaduto
  const { data: ev, error: evErr } = await supabase
    .from("events")
    .select("event_code, expires_at, payment_status, payment_expires_at")
    .eq("event_code", eventCode)
    .single();  

  if (evErr || !ev) {
    return NextResponse.json({ ok: false, error: "Evento non valido" }, { status: 404 });
  }

  const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
  if (exp && Date.now() > exp) {
    return NextResponse.json({ ok: false, error: "Evento scaduto" }, { status: 410 });
  }

  if (PAYMENT_REQUIRED && !isDemo) {
  const paymentStatus = String(ev.payment_status || "").trim().toLowerCase();
  const paymentExp = ev.payment_expires_at ? Date.parse(ev.payment_expires_at) : 0;

  if (paymentStatus !== "paid") {
    if (paymentExp && Date.now() > paymentExp) {
      return NextResponse.json(
        { ok: false, error: "Evento non attivo: pagamento scaduto" },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Evento non attivo: pagamento richiesto" },
      { status: 402 }
    );
  }
}

const rawUrl = url; // ✅ FIX 1
const cleanUrl = extractFirstUrl(rawUrl) || rawUrl;
const shareText = cleanUrl ? stripUrlFromText(rawUrl, cleanUrl) : "";

const platform = detectPlatform(cleanUrl);
const youtubeVideoId = platform === "youtube" ? extractYouTubeVideoId(cleanUrl) : "";

let tidalUrl: string | null = null;

if (platform === "tidal") {
  tidalUrl = cleanUrl;
}

const isPlaylist =
  (platform === "youtube" && cleanUrl.includes("list=")) ||
  (platform === "spotify" && cleanUrl.toLowerCase().includes("/playlist/"));

const baseTitle = (shareText || title || "").trim();


const safeTitle = isPlaylist
  ? (baseTitle || (platform === "youtube" ? "Playlist YouTube" : "Playlist Spotify"))
  : await resolveTitleServer(baseTitle, cleanUrl, platform);

const finalTitle =
  safeTitle && safeTitle.trim()
    ? safeTitle.trim()
    : shareText || `Richiesta ${platform === "amazon" ? "Amazon Music" : platform === "apple" ? "Apple Music" : platform === "tidal" ? "TIDAL" : "Music"}`;

let seedBpm: number | null = null;

let tidalLibArtist: string | null = null;

if (platform === "tidal" && tidalUrl) {
  const trackIdMatch = String(tidalUrl).match(/track\/(\d+)/);
  const tidalTrackId = trackIdMatch?.[1] || null;

  if (tidalTrackId) {
    const { data: libByTrack, error: libTrackErr } = await supabase
      .from("music_library")
      .select("bpm, artist")
      .eq("tidal_track_id", tidalTrackId)
      .limit(1);

    if (libTrackErr) {
      console.error("MUSIC_LIBRARY TIDAL TRACK MATCH ERROR:", libTrackErr);
    } else {
      const row = libByTrack?.[0];
      if (row?.bpm !== null && row?.bpm !== undefined) {
        seedBpm = Number(row.bpm);
      }
      if (row?.artist) {
        tidalLibArtist = String(row.artist);
      }
    }
  }
}

const titleTail = finalTitle.includes("-")
  ? finalTitle.split("-").pop()?.trim() || finalTitle
  : finalTitle;

  const cleanTitle = (titleTail || finalTitle)
  .replace(/\(.*?\)/g, "")
  .replace(/\[.*?\]/g, "")
  .replace(/official|video|hd|audio/gi, "")
  .replace(/-/g, " ")
  .trim();

if (platform !== "tidal" && finalTitle) {
  let libMatch: any[] | null = null;

  const { data: libByFull, error: libErr1 } = await supabase
    .from("music_library")
    .select("tidal_url, title, bpm")
    .ilike("title", `%${cleanTitle}%`)
    .limit(1);

  if (libErr1) {
    console.error("MUSIC_LIBRARY FULL MATCH ERROR:", libErr1);
  } else if (libByFull?.[0]?.tidal_url) {
    libMatch = libByFull;
  }

  if (!libMatch?.[0]?.tidal_url && titleTail && titleTail !== finalTitle) {
    const { data: libByTail, error: libErr2 } = await supabase
      .from("music_library")
      .select("tidal_url, title, bpm")
      .ilike("title", `%${cleanTitle}%`)
      .limit(1);

    if (libErr2) {
      console.error("MUSIC_LIBRARY TAIL MATCH ERROR:", libErr2);
    } else if (libByTail?.[0]?.tidal_url) {
      libMatch = libByTail;
    }
  }

  if (libMatch?.[0]?.tidal_url) {
    tidalUrl = libMatch[0].tidal_url;

    if (libMatch[0].bpm !== null && libMatch[0].bpm !== undefined) {
      seedBpm = Number(libMatch[0].bpm);
    }
  }
}

const nowMs = Date.now();



  // MERGE: se stesso brano (youtubeVideoId) nello stesso evento -> +1 voto
  if (platform === "youtube" && youtubeVideoId) {
    const { data: existing } = await supabase
      .from("requests")
      .select("*")
      .eq("event_code", eventCode)
      .eq("platform", "youtube")
      .eq("youtube_video_id", youtubeVideoId)
      .limit(1);

    const row = existing?.[0];
    if (row) {
      const newVotes = Number(row.votes || 0) + 1;
      const mergedDedication = appendDedication(row.dedication || "", dedication);

const { data: upd, error: e2 } = await supabase
  .from("requests")
  .update({
    votes: newVotes,
    updated_at: nowMs,
    title: finalTitle,
    dedication: mergedDedication,
  })
  .eq("id", row.id)
  .select("*")
  .single();

      if (e2) {
        console.error("SUPABASE MERGE UPDATE ERROR:", e2);
        return NextResponse.json({ ok: false }, { status: 500 });
      }

      return NextResponse.json({ ok: true, merged: true, request: mapRow(upd) });
    }
  }

  // MERGE: stesso link (url) per altre piattaforme nello stesso evento -> +1 voto
if (platform !== "youtube" && cleanUrl) {
  const { data: existing, error: exErr } = await supabase
    .from("requests")
    .select("*")
    .eq("event_code", eventCode)
    .eq("platform", platform)
    .eq("url", cleanUrl)
    .limit(1);

  if (exErr) {
    console.error("SUPABASE MERGE READ ERROR:", exErr);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const row = existing?.[0];
  if (row) {
    const newVotes = Number(row.votes || 0) + 1;

    const mergedDedication = appendDedication(row.dedication || "", dedication);

const { data: upd, error: e2 } = await supabase
  .from("requests")
  .update({
    votes: newVotes,
    updated_at: nowMs,
    title: finalTitle || row.title,
    dedication: mergedDedication,
  })
  .eq("id", row.id)
  .select("*")
  .single();

    if (e2) {
      console.error("SUPABASE MERGE UPDATE ERROR:", e2);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true, merged: true, request: mapRow(upd) });
  }
}

if (isDemo) {
  const { count, error: cErr } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("event_code", eventCode);

  if (cErr) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  // max 2 richieste (righe) in demo
  if ((count ?? 0) >= 4) {
    return NextResponse.json(
      { ok: false, error: "Demo finita: massimo 2 canzoni." },
      { status: 429 }
    );
  }
}

 
  if (platform === "youtube" && youtubeVideoId) {
    const { data: prev } = await supabase
      .from("requests")
      .select("bpm, updated_at")
      .eq("platform", "youtube")
      .eq("youtube_video_id", youtubeVideoId)
      .not("bpm", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    const row = prev?.[0];
    if (row?.bpm !== null && row?.bpm !== undefined) seedBpm = Number(row.bpm);
  } else if (cleanUrl) {
    const { data: prev } = await supabase
      .from("requests")
      .select("bpm, updated_at")
      .eq("platform", platform)
      .eq("url", cleanUrl)
      .not("bpm", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    const row = prev?.[0];
    if (row?.bpm !== null && row?.bpm !== undefined) seedBpm = Number(row.bpm);
  }



  // INSERT nuova richiesta
  const { data, error } = await supabase
    .from("requests")
    .insert({
      event_code: eventCode,
      title: finalTitle,
      url: cleanUrl,
      dedication: dedication ? `❤️ ${dedication}` : "",
      platform,
      youtube_video_id: youtubeVideoId,
      tidal_url: tidalUrl,
      votes: 1,
      bpm: seedBpm,
      updated_at: nowMs,
      // created_at: default now() in DB
    })
    .select("*")
    .single();

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // AUTO-POPOLA music_library se la richiesta arriva da TIDAL
if (platform === "tidal" && tidalUrl) {
  const trackIdMatch = String(tidalUrl).match(/track\/(\d+)/);
  const tidalTrackId = trackIdMatch?.[1] || null;

  if (tidalTrackId) {
    const { error: libSaveErr } = await supabase
      .from("music_library")
      .upsert(
        {
          title: finalTitle || null,
          artist: tidalLibArtist,
          tidal_url: tidalUrl,
          tidal_track_id: tidalTrackId,
          bpm: seedBpm,
          source: "request_tidal",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tidal_track_id" }
      );

    if (libSaveErr) {
      console.error("MUSIC_LIBRARY UPSERT ERROR:", libSaveErr);
    }
  }
}

  return NextResponse.json({ ok: true, merged: false, request: mapRow(data) });
}


// PATCH /api/requests  body: { id, delta?: number }
export async function PATCH(req: Request) {
  const denied = requireSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({} as any));
  const id = String(body.id || "").trim();
  const delta = Number(body.delta ?? 1);
  const bpm = body.bpm; // può essere number o string
  const tidalSelected = body.tidal_selected;

  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

 const { data: row, error: e1 } = await supabase
  .from("requests")
  .select("votes, event_code")
  .eq("id", id)
  .single();

if (e1 || !row) {
  console.error("SUPABASE READ FOR VOTE ERROR:", e1);
  return NextResponse.json({ ok: false }, { status: 500 });
}

const eventCode = (row as any).event_code;

// BLOCCO se evento scaduto
const { data: ev, error: evErr } = await supabase
  .from("events")
  .select("expires_at")
  .eq("event_code", eventCode)
  .single();


if (evErr || !ev) {
  return NextResponse.json({ ok: false, error: "Evento non valido" }, { status: 404 });
}

const exp = ev.expires_at ? Date.parse(ev.expires_at) : 0;
if (exp && Date.now() > exp) {
  return NextResponse.json({ ok: false, error: "Evento scaduto" }, { status: 410 });
}

// update tidal_selected (solo DJ)
if (typeof tidalSelected === "boolean") {
  const nowMs = Date.now();

  const { data, error } = await supabase
    .from("requests")
    .update({ tidal_selected: tidalSelected })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("SUPABASE TIDAL_SELECTED UPDATE ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: mapRow(data) });
}

// update BPM (solo DJ)
if (bpm !== undefined && bpm !== null) {
  const bpmNum = Number(bpm);
  if (!Number.isFinite(bpmNum) || bpmNum <= 0 || bpmNum > 300) {
    return NextResponse.json({ ok: false, error: "BPM non valido" }, { status: 400 });
  }

  const nowMs = Date.now();
  const { data, error } = await supabase
    .from("requests")
    .update({ bpm: Math.round(bpmNum) })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("SUPABASE BPM UPDATE ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: mapRow(data) });
}

  const newVotes = Math.max(0, Number((row as any).votes || 0) + delta);
  const nowMs = Date.now();

  const { data, error: e2 } = await supabase
    .from("requests")
    .update({ votes: newVotes, updated_at: nowMs })
    .eq("id", id)
    .select("*")
    .single();

  if (e2) {
    console.error("SUPABASE VOTE UPDATE ERROR:", e2);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: mapRow(data) });
}

// DELETE /api/requests  body: { id }
export async function DELETE(req: Request) {
  const denied = requireSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({} as any));
  const id = String(body.id || "").trim();

  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const { error } = await supabase
    .from("requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("SUPABASE DELETE ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
