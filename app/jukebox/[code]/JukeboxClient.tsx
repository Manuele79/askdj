"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  const [currentKey, setCurrentKey] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerId = useRef(`jukebox-player-${Math.random().toString(16).slice(2)}`);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [playlistEnabled, setPlaylistEnabled] = useState(true);

  async function load() {
    try {
      const res = await fetch(
        `/api/requests?eventCode=${encodeURIComponent(code)}`,
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
        updatedAt: Number(r.updatedAt ?? r.updated_at ?? 0),
      }));

      setItems(mapped);
    } catch {
      // niente
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [code]);

  const youtubeItems = useMemo(() => {
    return (items || [])
      .filter((r) => {
        if (r.platform !== "youtube") return false;

        const isVideo = !!r.youtubeVideoId;
        const isPlaylist = isYouTubePlaylistUrl(r.url);

        if (isVideo) return true;
        if (playlistEnabled && isPlaylist) return true;

        return false;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [items, playlistEnabled]);

  useEffect(() => {
  if (!youtubeItems.length) {
    setCurrentKey("");
    setCurrentTitle("");
    return;
  }

  if (!currentKey) {
    const first = youtubeItems[0];
    const firstKey = first.youtubeVideoId || first.url;
    setCurrentKey(firstKey);
    setCurrentTitle(first.title || "YouTube");
    return;
  }

  const stillExists = youtubeItems.some(
    (r) => (r.youtubeVideoId || r.url) === currentKey
  );

  if (!stillExists) {
    const first = youtubeItems[0];
    const firstKey = first.youtubeVideoId || first.url;
    setCurrentKey(firstKey);
    setCurrentTitle(first.title || "YouTube");
  }
}, [youtubeItems, currentKey]);

function playCurrent() {
  const p = playerRef.current;
  if (!p) return;

  try {
    p.playVideo?.();
  } catch {}
}

function pauseCurrent() {
  const p = playerRef.current;
  if (!p) return;

  try {
    p.pauseVideo?.();
  } catch {}
}

function playNext() {
  if (!youtubeItems.length) return;

  const idx = youtubeItems.findIndex(
    (r) => (r.youtubeVideoId || r.url) === currentKey
  );

  if (idx < 0) {
    const first = youtubeItems[0];
    setCurrentKey(first.youtubeVideoId || first.url);
    setCurrentTitle(first.title || "YouTube");
    return;
  }

  const next = youtubeItems[idx + 1];

  if (next) {
    setCurrentKey(next.youtubeVideoId || next.url);
    setCurrentTitle(next.title || "YouTube");
    return;
  }

  if (loopEnabled) {
    const first = youtubeItems[0];
    setCurrentKey(first.youtubeVideoId || first.url);
    setCurrentTitle(first.title || "YouTube");
  }
}

useEffect(() => {
  let cancelled = false;

  async function initPlayer() {
    const current = youtubeItems.find(
      (r) => (r.youtubeVideoId || r.url) === currentKey
    );

    if (!current || !current.youtubeVideoId) return;

    await loadYouTubeIframeAPI();
    if (cancelled) return;

    const origin = window.location.origin;

    if (!playerRef.current) {
      playerRef.current = new window.YT.Player(playerContainerId.current, {
        videoId: current.youtubeVideoId,
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          origin,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
          },
          onStateChange: (e: any) => {
            if (e.data === 0) {
              playNext();
            }
          },
        },
      });

      return;
    }

    try {
      playerRef.current.loadVideoById(current.youtubeVideoId);
    } catch {}
  }

  initPlayer();

  return () => {
    cancelled = true;
  };
}, [currentKey, youtubeItems, loopEnabled]);

    if (redirecting) return null;


  return (
     <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[110px]" />

      <div className="mx-auto max-w-6xl px-4 py-8 overflow-x-hidden">
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
              Jukebox <span className="text-yellow-300">Client</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-300">
              Gli ospiti scelgono la musica... Il Jukebox la riproduce automaticamente...
            </p>

            {code && code !== "TEST123" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-yellow-400 font-extrabold tracking-widest text-sm">
                  EVENTO:
                </span>
                <span className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300 px-4 py-1.5 text-sm font-bold text-zinc-900 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                  {code}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <button
              onClick={() => setLoopEnabled((v) => !v)}
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
            className="rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110 transition"
            >
            ▶ Play
          </button>

            <button
             onClick={pauseCurrent}
             className="rounded-xl bg-zinc-900/60 px-5 py-3 text-sm font-extrabold text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800 transition"
            >
            ⏸ Pausa
            </button>

            <button
            onClick={playNext}
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
                Le richieste YouTube vengono riprodotte automaticamente in coda.
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-zinc-950/60 p-4">
            <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
            Ora in riproduzione
            </div>

            <div className="mt-2 text-base font-bold text-zinc-100">
            {currentTitle || "Nessun brano selezionato"}
            </div>

            <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl border border-yellow-400/30 bg-black">
            <div id={playerContainerId.current} className="h-full w-full"></div>
            </div>

            <div className="mt-2 text-xs text-zinc-400">
             {playerReady ? "Player pronto" : "Caricamento player..."}
          </div>
        </div>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
              {youtubeItems.length}
            </span>
          </div>

          {youtubeItems.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
              Nessuna richiesta YouTube disponibile per questo evento.
            </div>
          ) : (
            <ul className="space-y-3">
              {youtubeItems.map((r, idx) => {
                const isPlaylist = isYouTubePlaylistUrl(r.url) && !r.youtubeVideoId;

                return (
                  <li
                    key={r.id}
                    className={`rounded-2xl border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${
                    (r.youtubeVideoId || r.url) === currentKey
                     ? "border-cyan-400/50 bg-zinc-900/80 ring-1 ring-cyan-400/30"
                     : "border-zinc-700/40 bg-zinc-950/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-500">#{idx + 1}</div>

                        <button
                        onClick={() => {
                        const key = r.youtubeVideoId || r.url;
                        setCurrentKey(key);
                        setCurrentTitle(r.title || (isPlaylist ? "Playlist YouTube" : "YouTube"));
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
                          title="Arriva nel prossimo step"
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