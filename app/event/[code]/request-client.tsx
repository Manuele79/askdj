"use client";

import { useEffect, useMemo, useState } from "react";

type PlatformKey = "youtube" | "spotify" | "apple" | "amazon" | "tidal";

const PLATFORM_LINKS: { key: PlatformKey; label: string; href: string }[] = [
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
  { key: "spotify", label: "Spotify", href: "https://open.spotify.com/" },
  { key: "apple", label: "Apple Music", href: "https://music.apple.com/" },
  { key: "amazon", label: "Amazon Music", href: "https://music.amazon.com/" },
  { key: "tidal", label: "TIDAL", href: "https://tidal.com/" },

];

function looksLikeUrl(s: string) {
  const v = (s || "").trim();
  if (!v) return false;
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.includes("youtube.com") ||
    v.includes("youtu.be") ||
    v.includes("spotify.com") ||
    v.includes("music.apple.com") ||
    v.includes("itunes.apple.com") ||
    v.includes("music.amazon") ||
    v.includes("amazon.") ||
    v.includes("tidal.com")

  );
}

function looksLikeYouTube(u: string) {
  const s = (u || "").toLowerCase();
  return s.includes("youtube.com") || s.includes("youtu.be");
}

function storageKey(eventCode: string) {
  return `djreq_sent:${String(eventCode || "").toUpperCase()}`;
}

function voteStorageKey(eventCode: string) {
  return `djreq_votes:${String(eventCode || "").toUpperCase()}`;
}


type Platform = "youtube" | "spotify" | "apple" | "amazon" | "tidal" | "other";

  type SentItem = {
  title: string;
  url: string;
  platform: Platform;
  dedication?: string;
  ts: number;
};

type PublicRequestItem = {
  id: string;
  title: string;
  url: string;
  platform: Platform;
  dedication?: string;
  votes: number;
  ts?: number;
};



export default function RequestClient({ code }: { code: string }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [dedication, setDedication] = useState("");
  const [eventMode, setEventMode] = useState<"dj_party" | "jukebox" | null>(null);
  const [modeLoaded, setModeLoaded] = useState(false);
  const [sent, setSent] = useState<SentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [partyRequests, setPartyRequests] = useState<PublicRequestItem[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, true>>({});
  const [showPartyRequests, setShowPartyRequests] = useState(false);
  const [showTitle, setShowTitle] = useState(false);


  // carica storico da localStorage (solo questo telefono)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(code));
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
  const normalized: SentItem[] = arr
    .map((x: any) => {
      // vecchio formato: stringa = titolo
      if (typeof x === "string") {
        return {
          title: x,
          url: "",
          platform: "other",
          dedication: "",
          ts: Date.now(),
        } as SentItem;
      }

      // nuovo formato: oggetto
      if (x && typeof x === "object" && typeof x.title === "string") {
        return {
          title: x.title,
          url: typeof x.url === "string" ? x.url : "",
          platform: (x.platform as Platform) || "other",
          dedication: typeof x.dedication === "string" ? x.dedication : "",
          ts: typeof x.ts === "number" ? x.ts : Date.now(),
        } as SentItem;
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 200) as SentItem[];

  setSent(normalized);
}


    } catch {
      // ignore
    }
  }, [code]);

  useEffect(() => {
  if (!code) return;
  localStorage.setItem("dj_guest_event", code);
  }, [code]);


  useEffect(() => {
  const shared = localStorage.getItem("dj_shared_link");

  if (shared) {
    setLink(shared);
    localStorage.removeItem("dj_shared_link");
  }
}, []);


  // salva storico
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(code), JSON.stringify(sent.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [sent, code]);

  const visiblePlatforms =
  eventMode === "jukebox"
    ? PLATFORM_LINKS.filter((p) => p.key === "youtube")
    : PLATFORM_LINKS;

  const canSend = useMemo(() => {
    return title.trim().length > 0 || link.trim().length > 0;
  }, [title, link]);

  useEffect(() => {
  try {
    const raw = localStorage.getItem(voteStorageKey(code));
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      setVotedMap(obj);
    }
  } catch {
    // ignore
  }
}, [code]);


useEffect(() => {
  try {
    localStorage.setItem(voteStorageKey(code), JSON.stringify(votedMap));
  } catch {
    // ignore
  }
}, [votedMap, code]);

useEffect(() => {
  loadPartyRequests();
  loadEventMode();

  const t = setInterval(loadPartyRequests, 8000);
  return () => clearInterval(t);
}, [code]);



  async function pasteFromClipboard() {
  setHint("");
  try {
    if (!navigator.clipboard?.readText) {
      setHint("⚠️ Il browser non supporta l’incolla automatico. Incolla manualmente.");
      return;
    }

    const clipRaw = await navigator.clipboard.readText();
    const clip = (clipRaw || "").trim();
    if (!clip) {
      setHint("📋 Appunti vuoti. Copia prima un link dall’app musica.");
      return;
    }

    const lines = clip
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const urlLine = lines.find((l) => looksLikeUrl(l));
    if (!urlLine) {
      setHint("⚠️ Negli appunti non sembra esserci un link.");
      return;
    }

    const titleLine = lines.find(
      (l) => l !== urlLine && !looksLikeUrl(l)
    );

    setLink(urlLine);

    if (!title.trim() && titleLine) {
      setTitle(titleLine);
    }

    setHint("✅ Link incollato dagli appunti.");
    setTimeout(() => setHint(""), 1600);
  } catch {
    setHint("⚠️ Permesso negato o non disponibile. Incolla manualmente.");
  }
}

async function loadEventMode() {
  try {
    const resp = await fetch(`/api/events?eventCode=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (!resp.ok) {
      setModeLoaded(true);
      return;
    }

    const data = await resp.json().catch(() => null);
    const mode = data?.mode;

    if (mode === "jukebox" || mode === "dj_party") {
      setEventMode(mode);
    }

    setModeLoaded(true);
  } catch {
    setModeLoaded(true);
  }
}

async function loadPartyRequests() {
  try {
    const resp = await fetch(`/api/requests?eventCode=${encodeURIComponent(code)}`);
    if (!resp.ok) return;

    const data = await resp.json().catch(() => null);
    const arr = Array.isArray(data?.requests) ? data.requests : [];

    const normalized: PublicRequestItem[] = arr.map((r: any) => ({
      id: String(r.id),
      title: String(r.title || "Richiesta"),
      url: String(r.url || ""),
      platform: (String(r.platform || "other") as Platform),
      dedication: typeof r.dedication === "string" ? r.dedication : "",
      votes: Number(r.votes || 0),
      ts: Number(r.updatedAt || r.createdAt || Date.now()),
    }));

    setPartyRequests(normalized);
  } catch {
    // ignore
  }
}


  async function addRequest() {
    const t = title.trim();
    const url = link.trim();
    const isValidUrl = looksLikeUrl(url);
    const finalUrl = isValidUrl ? url : "";

    if (!t && !url) return;

    if (url && !isValidUrl) {
    setHint("⚠️ Nel campo link devi incollare un link valido.");
    return;
  }

    setLoading(true);
    setHint("");

    try {
      let finalTitle = t || "Richiesta";

      async function tryOembed(endpoint: string) {
        try {
          const res = await fetch(endpoint);
          if (!res.ok) return null;
          const data = await res.json();
          return data?.title ? String(data.title) : null;
        } catch {
          return null;
        }
      }

      if (url) {
        if (looksLikeYouTube(url)) {
          const titleFrom = await tryOembed(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          if (titleFrom) finalTitle = titleFrom;
        } else if (url.toLowerCase().includes("spotify.com")) {
          const titleFrom = await tryOembed(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
          );
          if (titleFrom) finalTitle = titleFrom;
        }
      }

      const resp = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventCode: code,
          title: finalTitle,
          url: finalUrl,
          dedication: dedication.trim().slice(0, 180),
        }),
      });

      if (!resp.ok) {
        setHint("⚠️ Errore invio. Riprova.");
        return;
      }

      // usa la risposta del server (titolo/platform/url “puliti”)
        const data = await resp.json().catch(() => null);

        const serverTitle =
         data?.request?.title ? String(data.request.title) : finalTitle;

        const serverUrl =
          data?.request?.url ? String(data.request.url) : url;

        const serverPlatform =
          data?.request?.platform ? String(data.request.platform) : null;


      const u = serverUrl.toLowerCase();

const fallbackPlatform: Platform =
  looksLikeYouTube(serverUrl) ? "youtube"
  : u.includes("spotify.com") ? "spotify"
  : u.includes("tidal.com") ? "tidal"
  : (u.includes("music.apple.com") || u.includes("itunes.apple.com")) ? "apple"
  : (u.includes("music.amazon") || u.includes("amazon.")) ? "amazon"
  : "other";

const platform = (serverPlatform as Platform) || fallbackPlatform;



      setSent((prev) => [
  {
    title: serverTitle,
    url: serverUrl,
    platform,
    dedication: dedication.trim().slice(0, 180),
    ts: Date.now(),
  },
  ...prev,
].slice(0, 30));


      setTitle("");
      setLink("");
      setDedication("");
      setHint("✅ Inviata!");
      setTimeout(() => setHint(""), 1400);
    } finally {
      setLoading(false);
    }
  }


  async function voteGuest(r: PublicRequestItem) {
  if (!r.id || votedMap[r.id]) return;

  try {
    const resp = await fetch("/api/requests/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    });

    if (!resp.ok) {
      setHint("⚠️ Errore voto. Riprova.");
      return;
    }

    setVotedMap((prev) => ({ ...prev, [r.id]: true }));
    setPartyRequests((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, votes: Number(x.votes || 0) + 1 } : x
      )
    );
  } catch {
    setHint("⚠️ Errore voto. Riprova.");
  }
}

function FakeSpectrumWide() {
  return (
    <div className="mt-4 flex items-end justify-center gap-2 h-10">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-yellow-300 via-emerald-400 to-pink-400 opacity-85 animate-[eqwide_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}

      <style jsx>{`
        @keyframes eqwide {
          0%   { height: 20%; opacity: .5; }
          25%  { height: 100%; opacity: 1; }
          50%  { height: 40%; opacity: .6; }
          75%  { height: 90%; opacity: .9; }
          100% { height: 20%; opacity: .5; }
        }
      `}</style>
    </div>
  );
}

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      {/* glow blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/8 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-400/6 blur-[110px]" />

      <div className="mx-auto max-w-2xl px-4 py-8">
    <header className="mb-4 text-center">
     <div className="flex items-center justify-center gap-4">
     <div className="relative h-14 w-14 rounded-2xl bg-yellow-400 grid place-items-center shadow-[0_0_35px_rgba(250,204,21,0.65)]">
     <div className="absolute inset-0 rounded-2xl bg-yellow-300/40 blur-xl animate-pulse" />
     <span className="relative text-2xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">🎧</span>
    </div>

     <div className="leading-tight text-center">
     <div className="text-xl sm:text-2xl font-black tracking-tight">
      <span className="text-yellow-300">Ask</span><span className="text-white">DJ</span>
    </div>
    <div className="text-sm text-zinc-300/80">Guest Music Requests</div>
   </div>
</div>


 <h1 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-white">
  Richiedi una <span className="text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)]">canzone...</span>
</h1>
  <div className="mx-auto mt-3 h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
<div className="mx-auto mt-[-3px] h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />


  <div className="mt-3 mb-1">
    <FakeSpectrumWide />
  </div>

  <div className="mt-3 flex items-center justify-center gap-2">
   {code && code !== "TEST123" && (
  <div className="mt-3 flex items-center justify-center gap-3">
    <span className="text-yellow-300 font-bold tracking-widest text-sm drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]">
     EVENTO:
    </span>

    <span className="px-4 py-1.5 rounded-full text-sm font-bold text-black bg-gradient-to-r from-yellow-300 via-amber-300 to-pink-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]">
    {code}
    </span>
  </div>
)}

  </div>
</header>
<section className="rounded-3xl border border-yellow-400/60 bg-zinc-900/50 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
  <div className="space-y-4">
    {/* Bottoni piattaforme */}
    {modeLoaded && (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-2">
        {visiblePlatforms.map((p) => {
          const color =
            p.key === "youtube"
              ? "bg-red-600 hover:bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.4)]"
              : p.key === "spotify"
              ? "bg-green-500 hover:bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.4)]"
              : p.key === "tidal"
              ? "bg-sky-500 hover:bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.4)]"
              : p.key === "apple"
              ? "bg-zinc-200 text-black hover:bg-white shadow-[0_0_18px_rgba(255,255,255,0.35)]"
              : p.key === "amazon"
              ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_18px_rgba(234,179,8,0.4)]"
              : "bg-zinc-600";

          return (
            <a
              key={p.key}
              href={p.href}
              target="_blank"
              rel="noreferrer"
             className={`rounded-full font-extrabold transition flex items-center justify-center ${
             eventMode === "jukebox" && p.key === "youtube"
                ? "w-full max-w-[260px] py-3 text-sm mx-auto"
                : "px-3 py-2 text-xs"
            } ${color}`}
            >
              {p.label}
            </a>
          );
        })}
      </div>

      <div className="text-center text-xs text-zinc-500">
        {eventMode === "jukebox"
         ? "Apri YouTube → copia link → incolla qui → invia al DJ"
         : "Apri app → copia link → incolla qui → invia al DJ "}
      </div>

      {!!hint && (
        <div className="rounded-xl border border-yellow-400 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-200">
          {hint}
        </div>
      )}
    </div>
  )}
    {/* Campo link */}
    <div>
      {!link.trim() && (
      <div className="mt-2">
       <button
          type="button"
         onClick={pasteFromClipboard}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-lime-300 to-yellow-300 px-4 py-4 text-base font-extrabold text-zinc-950 transition hover:brightness-110 animate-pulse shadow-[0_0_35px_rgba(132,204,22,0.7)]"
       >
         {eventMode === "jukebox" ? "📋 INCOLLA" : "INCOLLA IL LINK"}
       </button>
     </div>
    )}


      <input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder=" "
      className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-yellow-400/20"
      />
    </div>

    {/* Invia al DJ */}
    <button
      onClick={addRequest}
      disabled={!canSend || loading}
     className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold transition
  ${canSend && !loading
    ? link.trim()
      ? "bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] animate-pulse"
      : "bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]"
    : "bg-gradient-to-r from-emerald-950 via-zinc-900 to-cyan-950 text-zinc-400 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
  }
  disabled:cursor-not-allowed disabled:opacity-80`}
    >
      {loading ? "Invio..." : canSend ? "🔥 INVIA AL DJ" : "🚀 INVIA AL DJ"}
    </button>

        {/* Dedica */}
    <div>
      <label className="text-sm font-bold text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)] bg-clip-text">
        INVIA UNA DEDICA: <span className="text-white">scrivi qui sotto</span>

      <div className="mt-2 h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
       <div className="mt-[-3px] h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />

      </label>
      <textarea
        value={dedication}
        onChange={(e) => setDedication(e.target.value)}
        placeholder="          ❤️❤️ la Dedica viene letta solo in console DJ ❤️❤️"
        rows={2}
        className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
      />
      <div className="mt-1 text-xs text-zinc-500">{dedication.length}/180</div>
    </div>

    <div className="flex justify-center">
  <button
    type="button"
    onClick={() => setShowTitle((v) => !v)}
    className="text-xs font-bold text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)] underline opacity-80 hover:opacity-100"
  >
    {showTitle ? "➖ Nascondi titolo manuale" : "➕ Aggiungi titolo manuale"}
  </button>
</div>


    {/* Campo titolo */}
   {showTitle && (
  <div>
    <label className="text-sm font-bold text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)] bg-clip-text">
      SCRIVI IL TITOLO DELLA CANZONE : <span className="text-white"> non riproducibile su PARTY</span>

      <div className="mt-2 h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
      <div className="mt-[-3px] h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />
    </label>

    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="incolla qui il titolo della canzone"
      className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
    />
  </div>
)}


   <p className="text-xs text-zinc-500">
  {eventMode === "jukebox"
    ? "Questo evento accetta solo richieste YouTube."
    : "Party autoplay funziona solo con link YouTube. Gli altri link si aprono dal DJ."}
</p>

  </div>
</section>

        <section className="mt-6 rounded-3xl border border-yellow-400 bg-zinc-900/40 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-3">
           <div>
           <h2 className="text-base sm:text-lg font-black tracking-wide text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)]">
            Le tue Richieste:
           </h2>
           <div className="mt-2 h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
           <div className="mt-[-3px] h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />
          </div>

         <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-bold text-white shadow-[0_0_10px_rgba(250,204,21,0.3)]">
         {sent.length}
        </span>
      </div>


          {sent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Nessuna Richiesta</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sent.slice(0, 10).map((r, i) => (
                <li key={r.ts || i} className="rounded-xl border border-yellow-400 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100">
                <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{r.title}</div>
                <span className="text-[11px] text-zinc-400">
              {r.platform}
              </span>
            </div>
       
              {r.dedication && r.dedication.trim() && (
             <div className="mt-1 text-xs text-zinc-200">
               “{r.dedication}”
             </div>
             )}
           </li>
          ))}

            </ul>
          )}

          {sent.length > 0 && (
            <div className="mt-3 text-xs text-zinc-500">
              Se svuoti i dati del browser o cambi telefono, questo storico non segue.
            </div>
          )}

          <p className="mt-4 text-sm text-zinc-400">
            Invia il tuo brano al DJ in pochi secondi 🎧
        </p>


        </section>

<section className="mt-6 rounded-3xl border border-yellow-400 bg-zinc-900/40 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] ring-1 ring-white/5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-base sm:text-lg font-black tracking-wide text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,1)]">
       Vota le Richieste degli ospiti 🔥
      </h2>
      <div className="mt-2 h-[3px] w-24 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
      <div className="mt-[-3px] h-[3px] w-24 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />
    </div>

    <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-bold text-white shadow-[0_0_10px_rgba(250,204,21,0.3)]">
      {partyRequests.length}
    </span>
  </div>

  {partyRequests.length === 0 ? (
    <p className="mt-3 text-sm text-zinc-400">Nessuna richiesta del party</p>
  ) : (
    <>
    
    <div className="mt-3 flex justify-center">
  <button
    onClick={() => setShowPartyRequests((v) => !v)}
    className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2 text-xs font-extrabold text-black shadow-[0_0_12px_rgba(250,204,21,0.4)] hover:brightness-110 transition"
  >
    {showPartyRequests ? "⬆ Nascondi richieste party" : "🔥 Mostra richieste party"}
  </button>
</div>

  {showPartyRequests && (

    <ul className="mt-3 space-y-2">
      {[...partyRequests]
        .sort((a, b) => {
          const byVotes = Number(b.votes || 0) - Number(a.votes || 0);
          if (byVotes !== 0) return byVotes;
          return Number(b.ts || 0) - Number(a.ts || 0);
        })
        .slice(0, 20)
        .map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-yellow-400 bg-zinc-950/50 px-3 py-3 text-sm text-zinc-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{r.platform}</span>
                  <span>🔥 {r.votes}</span>
                </div>               
              </div>
              <button
                onClick={() => voteGuest(r)}
                disabled={!!votedMap[r.id]}
                className="shrink-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-2 text-xs font-extrabold text-zinc-950 shadow-[0_0_18px_rgba(250,204,21,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {votedMap[r.id] ? "✅ Votata" : "👍 Vota"}
              </button>
            </div>
          </li>
        ))}
    </ul>
   )}
  </>
)}

  <div className="mt-3 text-xs text-zinc-500">
    Puoi votare le richieste del party direttamente da qui.
  </div>
</section>

<div className="mt-6 flex justify-center">
  <button
    onClick={() => {
      localStorage.removeItem("dj_guest_event");
      window.location.href = "/";
    }}
    className="text-xs text-zinc-400 underline hover:text-white"
  >
    ⬅️ Esci dall’evento
  </button>
</div>
</div>


      
 {/* Footer */}
        <footer
  style={{
    marginTop: 34,
    padding: "22px 4px 28px",
    opacity: 0.82,
    fontSize: 12.5,
    textAlign: "center",
  }}
>
  <div style={{ marginBottom: 10, color: "#d4d4d8" }}>
    Nessun audio viene inviato. AskDJ gestisce solo link, titolo brano e dedica.
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      color: "#a1a1aa",
    }}
  >
    <span>© {new Date().getFullYear()} info@askdj.app — M.M.</span>

    <a
      href="/privacy"
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 999,
        textDecoration: "none",
        fontWeight: 800,
        color: "#0b0b14",
        background: "linear-gradient(90deg, #22d3ee, #f472b6)",
        boxShadow: "0 0 16px rgba(34,211,238,0.18)",
      }}
    >
      Privacy
    </a>
  </div>
</footer>

    </div>
  );
}
