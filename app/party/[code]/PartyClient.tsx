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
  _key: string; // unique key per confronto/advance
  _listId?: string;
};

export default function PartyClient({ code }: { code: string }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [currentKey, setCurrentKey] = useState<string>(""); // videoId o list:<id>
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [currentDedication, setCurrentDedication] = useState("");

  const [loopEnabled, setLoopEnabled] = useState(true);
  const [userStarted, setUserStarted] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  useEffect(() => {
  try {
    const v = localStorage.getItem(startedKey(code));
    if (v === "1") {
      startedRef.current = true;
      setUserStarted(true);
    }
  } catch {}
}, [code]);


  const playerRef = useRef<any>(null);
  const playerContainerId = useRef(
    `yt-player-${Math.random().toString(16).slice(2)}`
  );

  // refs per evitare closure "vecchie" dentro gli handler YouTube
  const playableRef = useRef<PlayableItem[]>([]);
  const currentKeyRef = useRef<string>("");
  const loopRef = useRef<boolean>(true);
  const advancingRef = useRef<boolean>(false);
  const startedRef = useRef<boolean>(false);

function startedKey(code: string) {
  return `djreq_party_started:${String(code || "").toUpperCase()}`;
}


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

      setItems(mapped);
    } catch {
      // zitto e carica
    }
  }

  const deleteRequest = async (id: string) => {
  if (!confirm("Cancellare questa richiesta?")) return;

  const r = await fetch("/api/requests", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!r.ok) {
    alert("Errore cancellazione");
    return;
  }

  setItems((prev) => prev.filter((x) => x.id !== id));
};

  const playable = useMemo<PlayableItem[]>(() => {
    const base = (items || [])
      .filter((r) => r.platform === "youtube" && (r.youtubeVideoId || isYouTubePlaylistUrl(r.url)))
      .map((r) => {
        const isPl = isYouTubePlaylistUrl(r.url) && !r.youtubeVideoId;
        if (isPl) {
          const listId = extractYouTubeListId(r.url);
          return {
            ...r,
            _kind: "playlist" as const,
            _key: `list:${listId || r.id}`, // se listId manca, fallback
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
        // playlist senza listId: comunque la mostriamo ma non sarà riproducibile; ok.
        if (x._kind === "video") return !!x.youtubeVideoId;
        return true;
      })
      .sort((a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt);

    return base;
  }, [items]);

  const spotifyList = useMemo(() => {
    return (items || [])
      .filter((r) => r.platform === "spotify" && r.url)
      .sort((a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt);
  }, [items]);

  const tidalList = useMemo(() => {
    return (items || [])
      .filter((r) => r.platform === "tidal" && r.url)
     .sort((a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt);
  }, [items]);


  const appleList = useMemo(() => {
    return (items || [])
      .filter((r) => r.platform === "apple" && r.url)
      .sort((a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt);
  }, [items]);

  const amazonList = useMemo(() => {
    return (items || [])
      .filter((r) => r.platform === "amazon" && r.url)
      .sort((a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt);
  }, [items]);



  useEffect(() => {
    playableRef.current = playable;
  }, [playable]);

  function findPlayableByKey(key: string) {
    return playableRef.current.find((p) => p._key === key);
  }

  function setNowPlayingFromItem(item: PlayableItem) {
    setCurrentKey(item._key);
    setCurrentTitle(item.title || (item._kind === "playlist" ? "Playlist YouTube" : ""));
    setCurrentDedication(item.dedication || "");

  }

  function playItem(item: PlayableItem, reason?: string) {
    const p = playerRef.current;
    if (!item) return;

    // Playlist
    if (item._kind === "playlist") {
      const listId = item._listId || extractYouTubeListId(item.url);
      if (!listId) {
        setStatusMsg("⚠️ Playlist non riproducibile (listId mancante)");
        return;
      }

      setStatusMsg(reason ? `▶️ Playlist (${reason})` : `▶️ Playlist`);
      setNowPlayingFromItem({ ...item, _key: `list:${listId}`, _listId: listId });

      // se player esiste già → loadPlaylist
      if (p?.loadPlaylist) {
        try {
          if (!startedRef.current && p.mute) p.mute();
          else p.unMute?.();

          p.loadPlaylist({ listType: "playlist", list: listId, index: 0 });
          p.playVideo?.();
        } catch {}
      }
      return;
    }

    // Video singolo
    const id = normalizeVideoId(item.youtubeVideoId);
    if (!id) return;

    setStatusMsg(reason ? `▶️ Play: ${id} (${reason})` : `▶️ Play: ${id}`);
    setNowPlayingFromItem(item);

    if (p?.loadVideoById) {
      try {
        if (!startedRef.current && p.mute) p.mute();
        else p.unMute?.();

        p.loadVideoById(id);
        p.playVideo?.();
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
      playItem(list[0], `advance idx=-1 (${reason})`);
      setTimeout(() => (advancingRef.current = false), 350);
      return;
    }

    const next = list[idx + 1];
    if (next) {
      playItem(next, `next (${reason})`);
      setTimeout(() => (advancingRef.current = false), 350);
      return;
    }

    if (loopRef.current) {
      playItem(list[0], `loop (${reason})`);
      setTimeout(() => (advancingRef.current = false), 350);
      return;
    }

    setStatusMsg("⏹ Fine coda (loop OFF)");
    setTimeout(() => (advancingRef.current = false), 350);
  }

  function playNext() {
    // manuale: sblocca e vai
    advancingRef.current = false;
    advance("manual");
  }

  // refresh lista
  useEffect(() => {
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [code]);

  // scegli primo brano se non c'è corrente / oppure se quello corrente non esiste più
  useEffect(() => {
    if (!playable.length) return;

    if (!currentKey) {
      // setta il primo e poi verrà caricato dal player init
      setNowPlayingFromItem(playable[0]);
      return;
    }

    const stillThere = playable.some((p) => p._key === currentKey);
    if (!stillThere) {
      setNowPlayingFromItem(playable[0]);
    }
  }, [playable, currentKey]);

  // init player / load current selection
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!currentKey) return;

      await loadYouTubeIframeAPI();
      if (cancelled) return;

      const origin = window.location.origin;
      const current = findPlayableByKey(currentKey);

      // crea il player una volta sola
      if (!playerRef.current) {
        // se è playlist, passa listType/list nei playerVars
        const isPl = current?._kind === "playlist";
        const listId = isPl ? (current?._listId || extractYouTubeListId(current?.url || "")) : "";

        playerRef.current = new window.YT.Player(playerContainerId.current, {
          videoId: !isPl ? (current?.youtubeVideoId || "") : "",
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            origin,
            ...(isPl && listId
              ? { listType: "playlist", list: listId }
              : {}),
          },
          events: {
            onReady: (e: any) => {
            try {
    // se l’utente ha già sbloccato audio → forza UNMUTE
            if (startedRef.current && e.target.unMute) e.target.unMute();

    // se non ha ancora sbloccato → lascia muto
             if (!startedRef.current && e.target.mute) e.target.mute();

            e.target.playVideo();
            } catch {}

  // titolo (lascia come già hai)
            if (current)
            setCurrentTitle(
            current.title ||
           (current._kind === "playlist" ? "Playlist YouTube" : "")
            );
            if (current) setCurrentDedication(current.dedication || "");

          },

            onStateChange: (e: any) => {
              // 0 = ended
              if (e.data === 0) {
                // Se stiamo riproducendo una playlist, NON avanzare ad ogni brano.
                // Avanziamo SOLO quando finisce tutta la playlist.
                const cur = findPlayableByKey(currentKeyRef.current);
                const p = playerRef.current;

                if (cur?._kind === "playlist" && p?.getPlaylist && p?.getPlaylistIndex) {
                  try {
                    const pl = p.getPlaylist?.() || [];
                    const idx = p.getPlaylistIndex?.() ?? -1;
                    const hasMoreInside = Array.isArray(pl) && idx >= 0 && idx < pl.length - 1;

                    // Se c'è ancora roba dentro la playlist, lasciamo fare a YouTube.
                    if (hasMoreInside) return;
                  } catch {
                    // se non riusciamo a leggere playlist, facciamo fallback: non advance immediato
                    return;
                  }
                }

                advancingRef.current = false;
                advance("ended");
              }
            },
            onError: (e: any) => {
  const code = e?.data;
  setStatusMsg(`⚠️ YouTube error ${code} → skip`);

  const cur = findPlayableByKey(currentKeyRef.current);
  const p = playerRef.current;

  // Se siamo in PLAYLIST: prova a passare al prossimo video della playlist
  if (cur?._kind === "playlist" && p?.nextVideo) {
    try {
      p.nextVideo();
      return; // resta dentro la playlist
    } catch {
      // se nextVideo fallisce, fallback sotto
    }
  }

  // Altrimenti: salta al prossimo item della coda generale
  advancingRef.current = false;
  setTimeout(() => advance(`error-${code}`), 200);
},

          },
        });

        return;
      }

      // se il player esiste già, carica il current selection
      const p = playerRef.current;

      try {
        if (!startedRef.current && p.mute) p.mute();
        else p.unMute?.();


        if (current?._kind === "playlist") {
          const listId = current._listId || extractYouTubeListId(current.url);
          if (listId && p.loadPlaylist) {
            p.loadPlaylist({ listType: "playlist", list: listId, index: 0 });
            p.playVideo?.();
          }
        } else {
          const vid = current?.youtubeVideoId || "";
          if (vid && p.loadVideoById) {
            p.loadVideoById(vid);
            p.playVideo?.();
            if (startedRef.current) p.unMute?.();

          }
        }
      } catch {}

      if (current) {
        setCurrentTitle(current.title || (current._kind === "playlist" ? "Playlist YouTube" : ""));
        if (current) setCurrentDedication(current.dedication || "");

      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  // fallback timer: per i VIDEO singoli ok, per PLAYLIST no (altrimenti skippa)
  useEffect(() => {
    const t = setInterval(() => {
      const cur = findPlayableByKey(currentKeyRef.current);
      if (cur?._kind === "playlist") return;

      const p = playerRef.current;
      if (!p || !p.getDuration || !p.getCurrentTime || !p.getPlayerState) return;

      try {
        const state = p.getPlayerState(); // 1=playing
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUserStart() {
  startedRef.current = true;
  setUserStarted(true);

  try {
    localStorage.setItem(startedKey(code), "1");
  } catch {}

  const p = playerRef.current;
  if (!p) return;

  try {
    p.unMute?.();
    p.playVideo?.();
    setStatusMsg("✅ Autoplay sbloccato");
  } catch {}
}

function resetParty() {
  startedRef.current = false;
  setUserStarted(false);

  try {
    localStorage.removeItem(startedKey(code));
  } catch {}

  setStatusMsg("🔁 Reset Party: premi Avvia Party");

  const first = playableRef.current?.[0];
  if (first) {
    advancingRef.current = false;
    playItem(first, "reset");
  }
}


  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute top-[-120px] right-[-100px] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[120px]" />

      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={resetParty}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-extrabold text-zinc-950 ring-2 ring-yellow-300/40 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg hover:brightness-110 transition"
              title="Reset Party"
            >
             <span>🎉</span>
             <span>Party Mode</span>
            </button>

            <h1 className="mt-4 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
              Riproduzione Automatica Solo YouTube
            </h1>

            {code && code !== "TEST123" && (
            <p className="mt-2 text-lg text-cyan-500">
             Evento: <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">{code}</span>
            </p>
             )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLoopEnabled((v) => !v)}
              className={[
              "rounded-xl px-6 py-3 text-sm font-extrabold transition",
              "shadow-[0_0_26px_rgba(34,211,238,0.18)]",
            loopEnabled
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:brightness-110"
              : "bg-zinc-900/60 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800",
            ].join(" ")}

            >
              🔁Loop {loopEnabled ? "ON" : "OFF"}
            </button>

            <button
              onClick={playNext}
              className="rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_22px_rgba(34,211,238,0.25)] hover:brightness-110 transition"

            >
              ⏭ Avanti
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-yellow-400/40 bg-zinc-950/70 p-4">
          {playable.length === 0 ? (
            <p className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
              Nessun YouTube in coda (video o playlist).
            </p>
          ) : (
            <>
              <div className="mb-2 text-xs text-zinc-400">{statusMsg}</div>

              <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
                Ora in Riproduzione:
                <span className="ml-2 font-semibold text-zinc-100">
                  {currentTitle || "—"}
                </span>
              </div>
                  {currentDedication && (
                   <div className="mt-2 text-sm sm:text-base italic">
                     <span className="text-red-400 font-semibold"> 💬 Dedica: </span>
                     <span className="ml-2 text-zinc-200">
                       {currentDedication}
                     </span>
                    </div>

                 )}

                
{!userStarted && (
  <div className="mb-3 rounded-2xl border border-yellow-400/40 bg-zinc-950 p-3 ring-1 ring-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
          ▶ Sblocca Autoplay
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-400">
          Premi una volta per attivare Party Autoplay.
        </div>
      </div>

      <button
        onClick={handleUserStart}
        className="rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400 px-4 py-2 text-sm font-extrabold text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.16)] hover:brightness-110 transition"
      >
        ▶ Avvia Party
      </button>
    </div>
  </div>
)}


              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-yellow-400/40 bg-black">
                <div id={playerContainerId.current} className="h-full w-full" />
              </div>

              <p className="mt-3 text-xs text-zinc-400">
                Tip: evita fullscreen su mobile se vuoi che il “next” sia affidabile.
              </p>
            </>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-zinc-950 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">Coda: YouTube</h2>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
              {playable.length}
            </span>
          </div>

          <ul className="space-y-2">
            {playable.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300 ${
                   r._key === currentKey
                     ? "bg-zinc-900/90 border-yellow-300 ring-2 ring-yellow-300 shadow-[0_0_35px_rgba(250,204,21,0.8)]"
                     : "border-zinc-700/40 bg-zinc-950/50 hover:bg-zinc-900/60"
                }`}

              >
                <div className="flex items-start justify-between gap-3">
             <button
              onClick={() => {
              advancingRef.current = false;
                playItem(r, "manual pick");
             }}
                className="min-w-0 flex-1 text-left font-semibold text-zinc-100 hover:underline"
            >
              {r.title || (r._kind === "playlist" ? "Playlist YouTube" : "—")}
               {r._kind === "playlist" ? "  📃" : ""}
              </button>

                <div className="flex shrink-0 items-center gap-2">
                   <span className="rounded-full bg-zinc-900/60 ring-1 ring-white/10 px-3 py-1 text-xs font-extrabold text-zinc-100">
                   🔥 {r.votes}
                   </span>

                   <button
                    onClick={() => deleteRequest(r.id)}
                       className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100 transition"
                       title="Elimina"
                     >
                       🗑️
                    </button>
                 </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

{/* --- SPOTIFY QUEUE (solo lista + link) --- */}
{spotifyList.length > 0 && (
  <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-zinc-950 backdrop-blur-sm p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
        Coda: Spotify
      </h2>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
        {spotifyList.length}
      </span>
    </div>

    <ul className="space-y-2">
      {spotifyList.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
        >
          <div className="flex items-center justify-between gap-3">
  <div className="min-w-0 flex-1">
    <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
      {r.title}
    </div>
    <div className="mt-0.5 truncate text-xs text-zinc-500">
      🔥 {r.votes}
    </div>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
    >
      🎵 Apri
    </a>

    <button
      onClick={() => deleteRequest(r.id)}
      className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100 transition"
      title="Elimina"
    >
      🗑️
    </button>
  </div>
</div>
        </li>
      ))}
    </ul>
  </section>
)}

{/* --- TIDAL QUEUE --- */}
{tidalList.length > 0 && (
  <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-zinc-950 backdrop-blur-sm p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
        Coda: TIDAL
      </h2>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
        {tidalList.length}
      </span>
    </div>

    <ul className="space-y-2">
      {tidalList.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
        >
<div className="flex items-center justify-between gap-3">
  <div className="min-w-0 flex-1">
    <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
      {r.title}
    </div>
    <div className="mt-0.5 truncate text-xs text-zinc-500">
      🔥 {r.votes}
    </div>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
    >
      🌊 Apri
    </a>

    <button
      onClick={() => deleteRequest(r.id)}
      className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100 transition"
      title="Elimina"
    >
      🗑️
    </button>
  </div>
</div>
        </li>
      ))}
    </ul>
  </section>
)}

{/* --- APPLE MUSIC QUEUE --- */}
{appleList.length > 0 && (
  <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-zinc-950 backdrop-blur-sm p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
        Coda: Apple Music
      </h2>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
        {appleList.length}
      </span>
    </div>

    <ul className="space-y-2">
      {appleList.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
        >
<div className="flex items-center justify-between gap-3">
  <div className="min-w-0 flex-1">
    <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
      {r.title}
    </div>
    <div className="mt-0.5 truncate text-xs text-zinc-500">
      🔥 {r.votes}
    </div>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-extrabold text-zinc-900 hover:bg-white transition"
    >
      🍎 Apri
    </a>

    <button
      onClick={() => deleteRequest(r.id)}
      className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100 transition"
      title="Elimina"
    >
      🗑️
    </button>
  </div>
</div>
        </li>
      ))}
    </ul>
  </section>
)}

{/* --- AMAZON MUSIC QUEUE --- */}
{amazonList.length > 0 && (
  <section className="mt-6 rounded-2xl border border-yellow-400/40 bg-zinc-950 backdrop-blur-sm p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
        Coda: Amazon Music
      </h2>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
        {amazonList.length}
      </span>
    </div>

    <ul className="space-y-2">
      {amazonList.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
        >
<div className="flex items-center justify-between gap-3">
  <div className="min-w-0 flex-1">
    <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
      {r.title}
    </div>
    <div className="mt-0.5 truncate text-xs text-zinc-500">
      🔥 {r.votes}
    </div>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black hover:bg-yellow-400 transition"
    >
      🛒 Apri
    </a>

    <button
      onClick={() => deleteRequest(r.id)}
      className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100 transition"
      title="Elimina"
    >
      🗑️
    </button>
  </div>
</div>
        </li>
      ))}
    </ul>
  </section>
)}

      </div>
    </div>
  );
}
