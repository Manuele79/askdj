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
  _key: string;
  _listId?: string;
};

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
  const [currentKey, setCurrentKey] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [currentDedication, setCurrentDedication] = useState("");
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [playlistEnabled, setPlaylistEnabled] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerId = useRef(
    `jukebox-player-${Math.random().toString(16).slice(2)}`
  );

  const playableRef = useRef<PlayableItem[]>([]);
  const currentKeyRef = useRef<string>("");
  const loopRef = useRef<boolean>(true);
  const advancingRef = useRef<boolean>(false);

  useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

  useEffect(() => {
    loopRef.current = loopEnabled;
  }, [loopEnabled]);

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

      setItems((prev) =>
        JSON.stringify(prev) === JSON.stringify(mapped) ? prev : mapped
      );
    } catch {
      // niente
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [code]);

  const playable = useMemo<PlayableItem[]>(() => {
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
  }, [items, playlistEnabled]);

  useEffect(() => {
    playableRef.current = playable;
  }, [playable]);

  function findPlayableByKey(key: string) {
    return playableRef.current.find((p) => p._key === key);
  }

  function setNowPlayingFromItem(item: PlayableItem) {
    setCurrentKey(item._key);
    setCurrentTitle(
      item.title || (item._kind === "playlist" ? "Playlist YouTube" : "")
    );
    setCurrentDedication(item.dedication || "");
  }

  function playItem(item: PlayableItem, reason?: string) {
    const p = playerRef.current;
    if (!item) return;

    if (item._kind === "playlist") {
      const listId = item._listId || extractYouTubeListId(item.url);
      if (!listId) {
        setStatusMsg("⚠️ Playlist non riproducibile");
        return;
      }

      setStatusMsg(reason ? `▶️ Playlist (${reason})` : `▶️ Playlist`);
      setNowPlayingFromItem({ ...item, _key: `list:${listId}`, _listId: listId });

      if (p?.loadPlaylist) {
        try {
          p.loadPlaylist({ listType: "playlist", list: listId, index: 0 });
          p.playVideo?.();
          setIsPlaying(true);
        } catch {}
      }
      return;
    }

    const id = normalizeVideoId(item.youtubeVideoId);
    if (!id) return;

    setStatusMsg(reason ? `▶️ Play (${reason})` : `▶️ Play`);
    setNowPlayingFromItem(item);

    if (p?.loadVideoById) {
      try {
        p.loadVideoById(id);
        p.playVideo?.();
        setIsPlaying(true);
      } catch {}
    }
  }

  function advance(reason: string) {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const list = playableRef.current;
    const curKey = currentKeyRef.current;

    if (!list.length) {
      advancingRef.current = false;
      return;
    }

    const idx = list.findIndex((p) => p._key === curKey);

    if (idx < 0) {
      playItem(list[0], `start (${reason})`);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    const next = list[idx + 1];
    if (next) {
      playItem(next, `next (${reason})`);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    if (loopRef.current) {
      playItem(list[0], `loop (${reason})`);
      setTimeout(() => {
        advancingRef.current = false;
      }, 350);
      return;
    }

    setStatusMsg("⏹ Fine libreria");
    setIsPlaying(false);

    setTimeout(() => {
      advancingRef.current = false;
    }, 350);
  }

  function playCurrent() {
    const p = playerRef.current;

    if (!currentKey && playableRef.current.length) {
      playItem(playableRef.current[0], "manual start");
      return;
    }

    if (!p) return;

    try {
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
      setStatusMsg("⏸ Pausa");
    } catch {}
  }

  function playNext() {
    advancingRef.current = false;
    advance("manual");
  }

  useEffect(() => {
    if (!playable.length) {
      setCurrentKey("");
      setCurrentTitle("");
      setCurrentDedication("");
      return;
    }

    if (!currentKey) {
      setNowPlayingFromItem(playable[0]);
      return;
    }

    const stillThere = playable.some((p) => p._key === currentKey);
    if (!stillThere) {
      setNowPlayingFromItem(playable[0]);
    }
  }, [playable, currentKey]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!currentKey) return;

      await loadYouTubeIframeAPI();
      if (cancelled) return;

      const origin = window.location.origin;
      const current = findPlayableByKey(currentKey);

      if (!current) return;

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
            },
            onStateChange: (e: any) => {
              if (e.data === 1) setIsPlaying(true);
              if (e.data === 2) setIsPlaying(false);

              if (e.data === 0) {
                const cur = findPlayableByKey(currentKeyRef.current);
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

                advancingRef.current = false;
                advance("ended");
              }
            },
            onError: (e: any) => {
              const code = e?.data;
              setStatusMsg(`⚠️ YouTube error ${code}`);

              const cur = findPlayableByKey(currentKeyRef.current);
              const p = playerRef.current;

              if (cur?._kind === "playlist" && p?.nextVideo) {
                try {
                  p.nextVideo();
                  return;
                } catch {}
              }

              advancingRef.current = false;
              setTimeout(() => advance(`error-${code}`), 200);
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
          }
        } else {
          const vid = current.youtubeVideoId || "";
          if (vid && p.loadVideoById) {
            p.loadVideoById(vid);
          }
        }
      } catch {}
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [currentKey]);

  useEffect(() => {
    const t = setInterval(() => {
      const cur = findPlayableByKey(currentKeyRef.current);
      if (cur?._kind === "playlist") return;

      const p = playerRef.current;
      if (!p || !p.getDuration || !p.getCurrentTime || !p.getPlayerState) return;

      try {
        const state = p.getPlayerState();
        if (state !== 1) return;

        const dur = p.getDuration();
        const curT = p.getCurrentTime();

        if (dur > 0 && curT > 0 && dur - curT < 0.7) {
          advancingRef.current = false;
          advance("timer");
        }
      } catch {}
    }, 500);

    return () => clearInterval(t);
  }, []);

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
              Jukebox <span className="text-yellow-300">Music</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-300">
              Gli ospiti scelgono la musica. Il Jukebox la riproduce automaticamente.
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

          {code && code !== "TEST123" && (
  <div className="mb-4 flex justify-center">
    <div className="scale-90 sm:scale-100">
      <EventQr eventCode={code} />
    </div>
  </div>
)}

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
              className={[
                 "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                 isPlaying
                 ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                 : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
             ].join(" ")}
            >
              ▶ Play
            </button>

            <button
              onClick={pauseCurrent}
              className={[
                "rounded-xl px-5 py-3 text-sm font-extrabold transition",
                !isPlaying
                  ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-600"
                  : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
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

                return (
                  <li
                    key={r.id}
                    className={`rounded-2xl border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${
                      r._key === currentKey
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
                            playItem(r, "manual pick");
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