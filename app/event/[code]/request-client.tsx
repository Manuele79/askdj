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

function FakeSpectrumWide() {
  return (
    <div className="mt-4 flex items-end justify-center gap-2 h-10">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-amber-400 via-orange-400 to-pink-400 opacity-80 animate-[eqwide_1.4s_ease-in-out_infinite]"
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



function looksLikeYouTube(u: string) {
  const s = (u || "").toLowerCase();
  return s.includes("youtube.com") || s.includes("youtu.be");
}

function storageKey(eventCode: string) {
  return `djreq_sent:${String(eventCode || "").toUpperCase()}`;
}

type Platform = "youtube" | "spotify" | "apple" | "amazon" | "tidal" | "other";

  type SentItem = {
  title: string;
  url: string;
  platform: Platform;
  dedication?: string;
  ts: number;
};


export default function RequestClient({ code }: { code: string }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [dedication, setDedication] = useState("");
  const [sent, setSent] = useState<SentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");

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

  // salva storico
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(code), JSON.stringify(sent.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [sent, code]);

  const canSend = useMemo(() => {
    return title.trim().length > 0 || link.trim().length > 0;
  }, [title, link]);

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


  async function addRequest() {
    const t = title.trim();
    const url = link.trim();
    if (!t && !url) return;

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
          url: url,
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      {/* glow blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[110px]" />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <svg
              viewBox="0 0 64 64"
              className="h-20 w-20 drop-shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            >
              <defs>
                <linearGradient id="mvGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>

              {/* arco cuffie */}
              <path
                d="M12 34c0-12 8-22 20-22s20 10 20 22"
                fill="none"
                stroke="url(#mvGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* pad sinistra */}
              <rect x="6" y="32" width="10" height="20" rx="4" fill="url(#mvGrad)" />
              {/* pad destra */}
              <rect x="48" y="32" width="10" height="20" rx="4" fill="url(#mvGrad)" />

              {/* MV centrato e leggibile */}
              <text
                x="32"
                y="45"
                textAnchor="middle"
                fontSize="26"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                fill="#e5e7eb"
              >
                M
              </text>
              <text
                x="32"
                y="45"
                textAnchor="middle"
                fontSize="26"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                fill="#fb7185"
                opacity="0.95"
              >
                V
              </text>
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.18)]">
            AskDJ
          </h2>

          <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-emerald-200 to-pink-200">
            RICHIEDI UNA CANZONE...
          </h1>

          <p className="mt-3 text-base font-semibold text-cyan-600">
            EVENTO :
            <span className="ml-2 inline-flex items-center rounded-full px-3 py-1 font-mono text-sm text-zinc-950 bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
              {code}
            </span>
          </p>
        </header>

        <section className="rounded-3xl border border-yellow-400 bg-zinc-900/50 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-pink-400">
                SCRIVI IL TITOLO DELLA CANZONE...
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="incolla qui il titolo della canzone"
                className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-pink-400">
                COPIA IL LINK DA: YouTube/Spotify/Apple/Amazon/Tidal…
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Incolla qui il link della canzone"
                className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              />

              {/* Incolla link: subito sotto al campo link */}
              <div className="mt-2">
                <button
                type="button"
                onClick={pasteFromClipboard}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_22px_rgba(34,211,238,0.45)] hover:brightness-110 transition"
              >
               📋 INCOLLA IL LINK
              </button>

              </div>

              {/* Dedica */}
              <div className="mt-3">
                <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-pink-300">
                  VUOI SCRIVERE UNA DEDICA CON LA CANZONE SCRIVI QUI SOTTO: 
                </label>
                <textarea
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="   ❤️ Dedica ❤️     (viene letta solo in console DJ)"
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-yellow-400 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
                />
                <div className="mt-1 text-xs text-zinc-500">{dedication.length}/180</div>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Party autoplay funziona solo con link YouTube. Gli altri link si aprono dal DJ.
              </p>
            </div>

            {/* Invia al DJ */}
            <button
              onClick={addRequest}
              disabled={!canSend || loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400 px-4 py-3 text-sm font-extrabold text-zinc-950 transition shadow-[0_0_26px_rgba(34,211,238,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Invio..." : "🚀 INVIA AL DJ"}
            </button>

            {/* Bottoni piattaforme */}
            <div className="mt-1 space-y-3">
              <div className="flex flex-wrap justify-center gap-2">
                {PLATFORM_LINKS.map((p) => {
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
      className={`rounded-full px-3 py-2 text-xs font-extrabold transition ${color}`}
    >
      Apri {p.label}
    </a>
  );
})}

              </div>

              <div className="text-center text-xs text-zinc-500">
                Tip: Apri l’app → scegli brano → Condividi/Copia link → torna qui → (📋 Incolla link).
              </div>

              {!!hint && (
                <div className="rounded-xl border border-yellow-400 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-200">
                  {hint}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-yellow-400 bg-zinc-900/40 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] ring-1 ring-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-pink-300">
              Richieste inviate da questo telefono:
            </h2>
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{sent.length}</span>
          </div>

          {sent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Nessuna richiesta</p>
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
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          NESSUN AUDIO VIENE INVIATO. SOLO il LINK canzone/titolo e dedica.
        </footer>
      </div>
    </div>
  );
}
