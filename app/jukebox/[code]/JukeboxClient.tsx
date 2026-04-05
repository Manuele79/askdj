"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EventQr from "@/app/components/EventQr";

type RequestItem = {
  id: string;
  eventCode: string;
  title: string;
  url: string;
  dedication: string;
  platform: "youtube" | "spotify" | "apple" | "amazon" | "tidal" | "other";
  youtubeVideoId: string;
  votes: number;
  createdAt: number;
  updatedAt: number;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeIframeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();

    const existing = document.getElementById("yt-iframe-api");
    if (existing) {
      const t = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      return;
    }

    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => resolve();
  });
}

function normalizeVideoId(x: any) {
  return String(x || "").trim();
}

function isYouTubePlaylistUrl(urlStr: string) {
  const u = (urlStr || "").toLowerCase();
  return u.includes("youtube.com") && u.includes("list=");
}

function extractYouTubeListId(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

type PlayKind = "video" | "playlist";

type PlayableItem = RequestItem & {
  _kind: PlayKind;
  _key: string; // chiave sorgente/base
  _listId?: string;
};

type QueueEntry = PlayableItem & {
  _queueKey: string; // chiave unica per ogni ingresso in coda
};

function buildPlayableList(
  items: RequestItem[],
  playlistEnabled: boolean
): PlayableItem[] {
  return (items || [])
    .filter((r) => {
      if (r.platform !== "youtube") return false;

      const isVideo = !!r.youtubeVideoId;
      const isPlaylist = isYouTubePlaylistUrl(r.url);

      if (isVideo) return true;
      if (playlistEnabled && isPlaylist) return true;

      return false;
    })
    .map((r) => {
      const isPl = isYouTubePlaylistUrl(r.url) && !r.youtubeVideoId;

      if (isPl) {
        const listId = extractYouTubeListId(r.url);
        return {
          ...r,
          _kind: "playlist" as const,
          _key: `list:${listId || r.id}`,
          _listId: listId || "",
        };
      }

      return {
        ...r,
        _kind: "video" as const,
        _key: r.youtubeVideoId,
      };
    })
    .filter((x) => {
      if (x._kind === "video") return !!x.youtubeVideoId;
      return true;
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export default function JukeboxClient({ code }: { code: string }) {
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("jukebox_event");

    if (saved && code === "TEST123") {
      window.location.href = `/jukebox/${saved}`;
    } else {
      setRedirecting(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    localStorage.setItem("jukebox_event", code);
  }, [code]);

  const [items, setItems] = useState<RequestItem[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const [currentKey, setCurrentKey] = useState<string>(""); // queue key
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [currentDedication, setCurrentDedication] = useState("");

  const [loopEnabled, setLoopEnabled] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [playlistEnabled, setPlaylistEnabled] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [eventExpired, setEventExpired] = useState(false);
  const [eventChecked, setEventChecked] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerId = useRef(
    `jukebox-player-${Math.random().toString(16).slice(2)}`
  );

  const queueRef = useRef<QueueEntry[]>([]);
  const itemsRef = useRef<RequestItem[]>([]);
  const currentKeyRef = useRef<string>("");
  const loopRef = useRef<boolean>(true);
  const advancingRef = useRef<boolean>(false);
  const lastSeenRef = useRef<Record<string, number>>({});
  const queueSeqRef = useRef<number>(0);
  const pendingAutoplayRef = useRef<boolean>(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

  useEffect(() => {
    loopRef.current = loopEnabled;
  }, [loopEnabled]);

  const playable = useMemo<PlayableItem[]>(() => {
    return buildPlayableList(items, playlistEnabled);
  }, [items, playlistEnabled]);

  function makeQueueEntry(item: PlayableItem): QueueEntry {
    queueSeqRef.current += 1;
    return {
      ...item,
      _queueKey: `${item._key}__${Date.now()}__${queueSeqRef.current}`,
    };
  }

  function findQueueEntryByKey(key: string) {
    return queueRef.current.find((p) => p._queueKey === key);
  }

  function getCurrentQueueEntry() {
    return findQueueEntryByKey(currentKeyRef.current);
  }

  function setNowPlayingFromEntry(item: QueueEntry) {
    setCurrentKey(item._queueKey);
    setCurrentTitle(
      item.title || (item._kind === "playlist" ? "Playlist YouTube" : "")
    );
    setCurrentDedication(item.dedication || "");
  }

  function insertIntoQueueAfterCurrent(newEntries: QueueEntry[]) {
    if (!newEntries.length) return;

    setQueue((prev) => {
      if (!prev.length) return [...newEntries];

      const curKey = currentKeyRef.current;
      const idx = prev.findIndex((p) => p._queueKey === curKey);

      if (idx < 0) return [...prev, ...newEntries];

      return [
        ...prev.slice(0, idx + 1),
        ...newEntries,
        ...prev.slice(idx + 1),
      ];
    });
  }

  function queueAndPlayNow(item: PlayableItem, reason?: string) {
    const entry = makeQueueEntry(item);

    setQueue((prev) => {
      if (!prev.length) return [entry];

      const curKey = currentKeyRef.current;
      const idx = prev.findIndex((p) => p._queueKey === curKey);

      if (idx < 0) return [entry, ...prev];

      return [...prev.slice(0, idx + 1), entry, ...prev.slice(idx + 1)];
    });

    pendingAutoplayRef.current = true;
    setStatusMsg(reason ? `▶️ Play (${reason})` : "▶️ Play");
    setNowPlayingFromEntry(entry);
  }

  function playQueueEntry(entry: QueueEntry, reason?: string, autoplay = true) {
    if (!entry) return;

    pendingAutoplayRef.current = autoplay;

    if (entry._kind === "playlist") {
      const listId = entry._listId || extractYouTubeListId(entry.url);
      if (!listId) {
        setStatusMsg("⚠️ Playlist non riproducibile");
        return;
      }
      setStatusMsg(reason ? `▶️ Playlist (${reason})` : `▶️ Playlist`);
      setNowPlayingFromEntry({ ...entry, _listId: listId });
      return;
    }

    const id = normalizeVideoId(entry.youtubeVideoId);
    if (!id) return;

    setStatusMsg(reason ? `▶️ Play (${reason})` : `▶️ Play`);
    setNowPlayingFromEntry(entry);
  }

  async function checkEventStatus() {
    if (!code || code === "TEST123") {
      setEventExpired(false);
      setEventChecked(true);
      return;
    }

    try {
      const res = await fetch(`/api/events?eventCode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });

      if (res.status === 410 || res.status === 404) {
        setEventExpired(true);
        setEventChecked(true);
        localStorage.removeItem("jukebox_event");

        try {
          playerRef.current?.pauseVideo?.();
        } catch {}

        setIsPlaying(false);
        setStatusMsg("⛔ Evento scaduto");
        return;
      }

      if (!res.ok) {
        setEventChecked(true);
        return;
      }

      setEventExpired(false);
      setEventChecked(true);
    } catch {
      setEventChecked(true);
    }
  }

  async function load() {
    try {
      const res = await fetch(
        `/api/jukebox/requests?eventCode=${encodeURIComponent(code)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      const mapped: RequestItem[] = (data.requests || []).map((r: any) => ({
        id: String(r.id),
        eventCode: String(r.eventCode ?? r.event_code ?? ""),
        title: String(r.title ?? ""),
        url: String(r.url ?? ""),
        dedication: String(r.dedication ?? ""),
        platform: (r.platform ?? "other") as any,
        youtubeVideoId: normalizeVideoId(
          r.youtubeVideoId ?? r.youtube_video_id ?? ""
        ),
        votes: Number(r.votes ?? 0),
        createdAt: Number(
          r.createdAt ?? (r.created_at ? Date.parse(r.created_at) : 0)
        ),
        updatedAt: Number(
          r.updatedAt ?? (r.updated_at ? Date.parse(r.updated_at) : 0)
        ),
      }));

      const prevItems = itemsRef.current;

      setItems((prev) =>
        JSON.stringify(prev) === JSON.stringify(mapped) ? prev : mapped
      );

      const nextPlayable = buildPlayableList(mapped, playlistEnabled);

      const seen: Record<string, number> = {};
      for (const r of mapped) {
        seen[r.id] = Number(r.updatedAt || r.createdAt || 0);
      }

      // primo caricamento: inizializza la queue dalla libreria attuale
      if (!Object.keys(lastSeenRef.current).length) {
        if (!queueRef.current.length) {
          setQueue(nextPlayable.map(makeQueueEntry));
        }
        lastSeenRef.current = seen;
        return;
      }

      const prevMap = new Map(prevItems.map((r) => [r.id, r]));
      const toEnqueue: QueueEntry[] = [];

      for (const p of nextPlayable) {
        const prevRow = prevMap.get(p.id);
        const currentSeen = lastSeenRef.current[p.id] ?? 0;
        const nextStamp = Number(p.updatedAt || p.createdAt || 0);

        const isBrandNew = !prevRow;
        const isUpdatedDuplicate = !!prevRow && nextStamp > currentSeen;

        if (isBrandNew || isUpdatedDuplicate) {
          toEnqueue.push(makeQueueEntry(p));
        }
      }

      if (toEnqueue.length) {
        insertIntoQueueAfterCurrent(toEnqueue);
      }

      lastSeenRef.current = seen;
    } catch {
      // niente
    }
  }

  useEffect(() => {
    checkEventStatus();
    load();

    const t1 = setInterval(load, 1500);
    const t2 = setInterval(checkEventStatus, 5000);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [code, playlistEnabled]);

  function advance(reason: string) {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const list = queueRef.current;
    const curKey = currentKeyRef.current;

    if (!list.length) {
      advancingRef.current = false;
      return;
    }

    const idx = list.findIndex((p) => p._queueKey === curKey);

    if (idx < 0) {
      playQueueEntry(list[0], `start (${reason})`, true);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    const next = list[idx + 1];
    if (next) {
      playQueueEntry(next, `next (${reason})`, true);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    if (loopRef.current) {
      playQueueEntry(list[0], `loop (${reason})`, true);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    setStatusMsg("⏹ Fine coda");
    setIsPlaying(false);

    setTimeout(() => {
      advancingRef.current = false;
    }, 350);
  }

  function playCurrent() {
    const p = playerRef.current;

    if (!currentKey && queueRef.current.length) {
      playQueueEntry(queueRef.current[0], "manual start", true);
      return;
    }

    if (!p) return;

    try {
      pendingAutoplayRef.current = true;
      p.playVideo?.();
      setIsPlaying(true);
      setStatusMsg("▶️ Riproduzione");
    } catch {}
  }

  function pauseCurrent() {
    const p = playerRef.current;
    if (!p) return;

    try {
      p.pauseVideo?.();
      setIsPlaying(false);
      pendingAutoplayRef.current = false;
      setStatusMsg("⏸ Pausa");
    } catch {}
  }

  function playNext() {
    advancingRef.current = false;
    advance("manual");
  }

  async function deleteRequest(id: string) {
    if (!confirm("Eliminare questo brano dalla libreria evento?")) return;

    const res = await fetch("/api/requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      alert("Errore eliminazione");
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));

    setQueue((prev) =>
      prev.filter((x) => !(x.id === id && x._queueKey !== currentKeyRef.current))
    );
  }

  useEffect(() => {
    if (!queue.length) {
      setCurrentKey("");
      setCurrentTitle("");
      setCurrentDedication("");
      return;
    }

    if (!currentKey) {
      setNowPlayingFromEntry(queue[0]);
      return;
    }

    const stillThere = queue.some((p) => p._queueKey === currentKey);
    if (!stillThere) {
      setNowPlayingFromEntry(queue[0]);
    }
  }, [queue, currentKey]);

  useEffect(() => {
    let cancelled = false;

    async function initOrLoadCurrent() {
      if (eventExpired) return;
      if (!currentKey) return;

      await loadYouTubeIframeAPI();
      if (cancelled) return;

      const origin = window.location.origin;
      const current = findQueueEntryByKey(currentKey);

      if (!current) return;

      const shouldAutoplay = pendingAutoplayRef.current;

      if (!playerRef.current) {
        const isPl = current._kind === "playlist";
        const listId = isPl
          ? current._listId || extractYouTubeListId(current.url)
          : "";

        playerRef.current = new window.YT.Player(playerContainerId.current, {
          videoId: !isPl ? current.youtubeVideoId || "" : "",
          playerVars: {
            autoplay: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            origin,
            ...(isPl && listId ? { listType: "playlist", list: listId } : {}),
          },
events: {
  onReady: () => {
    setPlayerReady(true);
    setStatusMsg("✅ Player pronto");

    if (pendingAutoplayRef.current) {
      try {
        playerRef.current?.playVideo?.();
        setIsPlaying(true);
      } catch {}
    }
  },

  onStateChange: (e: any) => {
    if (e.data === 1) setIsPlaying(true);
    if (e.data === 2) setIsPlaying(false);

    if (e.data === 0) {
      const cur = getCurrentQueueEntry();
      const p = playerRef.current;

      if (cur?._kind === "playlist" && p?.getPlaylist && p?.getPlaylistIndex) {
        try {
          const pl = p.getPlaylist?.() || [];
          const idx = p.getPlaylistIndex?.() ?? -1;
          const hasMoreInside =
            Array.isArray(pl) && idx >= 0 && idx < pl.length - 1;

          if (hasMoreInside) return;
        } catch {
          return;
        }
      }

      pendingAutoplayRef.current = true;
      advancingRef.current = false;
      advance("ended");
    }
  },

  onError: (e: any) => {
    const code = e?.data;

    console.log("YT ERROR:", code);

    if (code === 150 || code === 101) {
      setStatusMsg("⏭ Video bloccato, salto...");
    } else {
      setStatusMsg(`⚠️ YouTube error ${code}`);
    }

    const cur = getCurrentQueueEntry();
    const p = playerRef.current;

    if (cur?._kind === "playlist" && p?.nextVideo) {
      try {
        p.nextVideo();
        return;
      } catch {}
    }

    pendingAutoplayRef.current = true;
    advancingRef.current = false;
    advance(`error-${code}`);
  },

          },
        });

        return;
      }

      const p = playerRef.current;

      try {
        if (current._kind === "playlist") {
          const listId = current._listId || extractYouTubeListId(current.url);
          if (listId && p.loadPlaylist) {
            p.loadPlaylist({ listType: "playlist", list: listId, index: 0 });
            if (shouldAutoplay) {
              p.playVideo?.();
            }
          }
        } else {
          const vid = current.youtubeVideoId || "";
          if (vid && p.loadVideoById) {
            p.loadVideoById(vid);
            if (shouldAutoplay) {
              p.playVideo?.();
            }
          }
        }
      } catch {}
    }

    initOrLoadCurrent();

    return () => {
      cancelled = true;
    };
  }, [currentKey, eventExpired]);

  useEffect(() => {
    const t = setInterval(() => {
      if (eventExpired) return;

      const cur = getCurrentQueueEntry();
      if (cur?._kind === "playlist") return;

      const p = playerRef.current;
      if (!p || !p.getDuration || !p.getCurrentTime || !p.getPlayerState) return;

      try {
        const state = p.getPlayerState();
        if (state !== 1) return;

        const dur = p.getDuration();
        const curT = p.getCurrentTime();

        if (dur > 0 && curT > 0 && dur - curT < 0.7) {
          pendingAutoplayRef.current = true;
          advancingRef.current = false;
          advance("timer");
        }
      } catch {}
    }, 500);

    return () => clearInterval(t);
  }, [eventExpired]);

  const currentSourceKey =
    queue.find((q) => q._queueKey === currentKey)?._key || "";

  if (redirecting) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[110px]" />

      <div className="mx-auto max-w-6xl px-4 py-8 overflow-x-hidden">
        {eventChecked && eventExpired && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.18)]">
            <div className="font-extrabold text-red-300">⛔ Evento scaduto</div>
            <div className="mt-1 text-red-200/90">
              Questo Jukebox non è più attivo. Crea o apri un nuovo evento.
            </div>
          </div>
        )}

        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-yellow-400/50 blur-xl animate-pulse" />
                <span className="relative text-2xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">
                  📻
                </span>
              </div>

              <div className="leading-tight">
                <div className="text-4xl font-black tracking-tight">
                  <span className="text-yellow-300">Ask</span>
                  <span className="text-white">DJ</span>
                </div>
                <div className="text-xs text-zinc-300 tracking-wide">
                  Jukebox Mode
                </div>
              </div>
            </div>

            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white">
              Jukebox <span className="text-yellow-300">Music</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-300">
              Gli ospiti scelgono la musica... Il Jukebox la riproduce automaticamente...
            </p>

            {code && code !== "TEST123" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-yellow-300 font-extrabold tracking-widest text-sm">
                  EVENTO:
                </span>
                <span className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300 px-4 py-1.5 text-sm font-bold text-zinc-900 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                  {code}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            {code && code !== "TEST123" && !eventExpired && (
              <button
                onClick={() => setShowQr(true)}
                className="rounded-xl bg-zinc-900/60 px-5 py-3 text-sm font-extrabold text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800 transition"
              >
                🔳 QR ospiti
              </button>
            )}

            <button
              onClick={() => setLoopEnabled((v) => !v)}
              disabled={eventExpired}
              className={[
                "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                loopEnabled
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:brightness-110"
                  : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              🔁 Loop {loopEnabled ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => setPlaylistEnabled((v) => !v)}
              disabled={eventExpired}
              className={[
                "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                playlistEnabled
                  ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-zinc-950 hover:brightness-110"
                  : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              📃 Playlist YouTube {playlistEnabled ? "ON" : "OFF"}
            </button>

            <button
              onClick={playCurrent}
              disabled={eventExpired}
              className={[
                "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                isPlaying
                  ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              ▶ Play
            </button>

            <button
              onClick={pauseCurrent}
              disabled={eventExpired}
              className={[
                "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                !isPlaying
                  ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              ⏸ Pausa
            </button>

            <button
              onClick={playNext}
              disabled={eventExpired}
              className="rounded-xl bg-zinc-900/60 px-5 py-3 text-sm font-extrabold text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800 transition"
            >
              ⏭ Avanti
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-yellow-400/40 bg-zinc-950/70 p-4 shadow-[0_0_30px_rgba(250,204,21,0.12)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
                Libreria evento: YouTube
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Le richieste YouTube vengono riprodotte automaticamente in sequenza.
              </div>
            </div>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
              {playable.length}
            </span>
          </div>

          <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-zinc-950/60 p-4">
            <div className="mb-2 text-xs text-zinc-400">{statusMsg}</div>

            <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
              Ora in riproduzione
            </div>

            <div className="mt-2 text-base font-bold text-zinc-100">
              {currentTitle || "Nessun brano selezionato"}
            </div>

            {currentDedication && (
              <div className="mt-2 text-sm italic">
                <span className="text-red-400 font-semibold">💬 Dedica:</span>
                <span className="ml-2 text-zinc-200">{currentDedication}</span>
              </div>
            )}

            <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl border border-yellow-400/30 bg-black">
              <div id={playerContainerId.current} className="h-full w-full"></div>
            </div>

            <div className="mt-2 text-xs text-zinc-400">
              {playerReady ? "Player pronto" : "Caricamento player..."}
            </div>
          </div>

          {playable.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
              Nessuna richiesta YouTube disponibile per questo evento.
            </div>
          ) : (
            <ul className="space-y-3">
              {playable.map((r, idx) => {
                const isPlaylist = r._kind === "playlist";
                const isCurrentSource = r._key === currentSourceKey;

                return (
                  <li
                    key={r.id}
                    className={`rounded-2xl border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${
                      isCurrentSource
                        ? "border-cyan-400/50 bg-zinc-900/80 ring-1 ring-cyan-400/30"
                        : "border-zinc-700/40 bg-zinc-950/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-500">#{idx + 1}</div>

                        <button
                          onClick={() => {
                            advancingRef.current = false;
                            queueAndPlayNow(r, "manual pick");
                          }}
                          className="truncate text-left text-base font-extrabold text-zinc-100 hover:underline"
                        >
                          {r.title || (isPlaylist ? "Playlist YouTube" : "—")}
                        </button>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">
                            {isPlaylist ? "📃 Playlist" : "▶ Video"}
                          </span>

                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">
                            🔥 {r.votes}
                          </span>
                        </div>

                        {r.dedication && (
                          <div className="mt-2 text-xs italic text-zinc-300">
                            💬 {r.dedication}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-500 transition"
                        >
                          ▶ Apri
                        </a>

                        <button
                          className="rounded-xl bg-zinc-900/60 px-3 py-2 text-xs font-extrabold text-zinc-400 ring-1 ring-zinc-700"
                          onClick={() => deleteRequest(r.id)}
                        >
                          🗑 Elimina
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative bg-zinc-900 rounded-3xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <button
                onClick={() => setShowQr(false)}
                className="absolute -top-3 -right-3 rounded-full bg-zinc-800 px-3 py-1 text-xs text-white hover:bg-zinc-700"
              >
                ✕
              </button>

              <EventQr eventCode={code} />
            </div>
          </div>
        )}

        <footer
          style={{
            marginTop: 34,
            padding: "22px 4px",
            opacity: 0.58,
            fontSize: 12.5,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} info@askdj.app — Manuele Martino
        </footer>
      </div>
    </div>
  );
}