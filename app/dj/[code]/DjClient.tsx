"use client";

import { useEffect, useMemo, useState } from "react";
import EventQr from "@/app/components/EventQr";

type Platform = "youtube" | "spotify" | "apple" | "amazon" | "tidal" | "other";

type RequestItem = {
  id: string;
  eventCode: string;
  title: string;
  url: string;
  dedication: string;
  platform: Platform;
  youtubeVideoId: string;
  votes: number;
  createdAt: number;
  updatedAt: number;
  tidal_url?: string | null;
  tidal_selected?: boolean | null;
  tidal_synced?: boolean | null;
  bpm?: number | null;
};

function buildTidalSearchUrl(title: string) {
  return `https://listen.tidal.com/search?q=${encodeURIComponent(title)}`;
}

function PlatformButton({ r }: { r: RequestItem }) {
  if (!r.url) return null;

  const base =
    "rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-[0_6px_18px_rgba(0,0,0,0.25)]";

  switch (r.platform) {
    case "youtube":
      return (
        <a href={r.url} target="_blank" rel="noreferrer" className={`${base} bg-red-600`}>
          ▶ YouTube
        </a>
      );
    case "spotify":
      return (
        <a href={r.url} target="_blank" rel="noreferrer" className={`${base} bg-green-600`}>
          🎵 Spotify
        </a>
      );

    case "tidal":
      return (
         <a href={r.url} target="_blank" rel="noreferrer" className={`${base} bg-cyan-600`}>
            🌊 Tidal
         </a>
      );

      
    case "apple":
      return (
        <a href={r.url} target="_blank" rel="noreferrer" className={`${base} bg-zinc-700`}>
           Apple
        </a>
      );
    case "amazon":
      return (
        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className={`${base} bg-yellow-500 text-black`}
        >
          🛒 Amazon
        </a>
      );
    default:
      return (
        <a href={r.url} target="_blank" rel="noreferrer" className={`${base} bg-zinc-600`}>
          🔗 Link
        </a>
      );
  }
}

function openTidalWindow(url: string) {
  window.open(url, "TIDAL_WINDOW");
}

function TidalSearchButton({ r }: { r: RequestItem }) {
  if (r.platform === "tidal") return null;

  const tidalMatch = !!r.tidal_url;

  const color = tidalMatch
    ? "bg-green-400 text-black hover:bg-green-300"
    : "bg-yellow-400 text-black hover:bg-yellow-300";

  const title = tidalMatch ? "Open on Tidal" : "Search Tidal";

  const url = tidalMatch
    ? r.tidal_url!
    : buildTidalSearchUrl(r.title);

 return (
  <button
    onClick={() => openTidalWindow(url)}
    title={title}
    className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition shadow-[0_6px_18px_rgba(0,0,0,0.25)] ${color}`}
  >
    🔎
  </button>
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


function ModeButton({
  active,
  onClick,
  icon,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  variant: "dj" | "party";
}) {
  const activeClass =
    variant === "dj"
      ? "bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 ring-emerald-300/40 shadow-[0_0_25px_rgba(52,211,153,0.20)]"
      : "bg-gradient-to-r from-amber-300 to-orange-400 text-zinc-950 ring-amber-300/40 shadow-[0_0_25px_rgba(251,191,36,0.22)]";


  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-6 py-3 text-sm font-extrabold transition inline-flex items-center justify-center gap-2 min-w-[140px]",

        "ring-1",
        active
          ? activeClass
          : "bg-zinc-900/60 text-zinc-200 ring-zinc-700 hover:bg-zinc-800",
      ].join(" ")}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}


function makeEventCodeFromName(name: string) {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");

  const rand = Math.floor(1000 + Math.random() * 9000); // 4 cifre
  return `${base}-${rand}`;
}


export default function DjClient({ code }: { code: string }) {
  const [mode, setMode] = useState<"dj" | "party">("dj");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [eventName, setEventName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [currentBpm, setCurrentBpm] = useState<number | "">("");
  const [bpmEdit, setBpmEdit] = useState<Record<string, number | "">>({});
  const [openDedications, setOpenDedications] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [tidalConnected, setTidalConnected] = useState<boolean>(false);
  const [tidalChecked, setTidalChecked] = useState<boolean>(false);

  function resetPartyUnlock() {
    try {
      localStorage.removeItem(
        `djreq_party_started:${String(code || "").toUpperCase()}`
      );
    } catch {}
  }

  const [bpmDraft, setBpmDraft] = useState<string>("");
const [bpmTarget, setBpmTarget] = useState<number | null>(null);

const confirmBpmTarget = () => {
  const n = Number(bpmDraft);
  if (!Number.isFinite(n) || n <= 0 || n > 300) return;
  setBpmTarget(Math.round(n));
};

const targetZone = (bpm: number | null) => {
  if (!bpm) return "neutral";
  if (bpm < 90) return "low";       // verde
  if (bpm < 128) return "mid";      // giallo
  if (bpm < 140) return "high";     // blu
  return "peak";                   // rosso
};

const zoneClass = (zone: string) => {
  switch (zone) {
    case "low":  return "bg-green-400/50 ring-2 ring-green-400";
    case "mid":  return "bg-yellow-400/50 ring-2 ring-yellow-400";
    case "high": return "bg-sky-400/50 ring-2 ring-sky-400";
    case "peak": return "bg-red-400/50 ring-2 ring-red-400";
    default:     return "bg-zinc-900 ring-1 ring-yellow-400/30";
  }
};

function splitDedications(raw: string | null | undefined) {
  if (!raw) return [];

  return raw
    .split("\n")
    .map((x) => x.replace(/^❤️\s*/, "").trim())
    .filter(Boolean);
}

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) => b.votes - a.votes || b.updatedAt - a.updatedAt
    );
  }, [items]);

  async function load() {
    try {
      const res = await fetch(`/api/requests?eventCode=${encodeURIComponent(code)}`);
      const data = await res.json();
      const next: RequestItem[] = (data.requests || []).map((r: any) => ({
     ...r,
     dedication: String(r.dedication ?? ""),
    }));


      setItems((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    } catch {}
  }

  async function voteUp(r: RequestItem) {
    await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventCode: code,
        title: r.title,
        url: r.url,
      }),
    });
    load();
  }
  
  function printPlaylist() {
  const titles = sorted.map((r, i) => `${i + 1}. ${r.title}`);

  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(`
    <html>
      <head>
        <title>Playlist DJ</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
          }
          h1 {
            margin-bottom: 20px;
          }
          ul {
            font-size: 16px;
          }
          li {
            margin-bottom: 6px;
          }
        </style>
      </head>
      <body>
        <h1>Playlist DJ</h1>
        <ul>
          ${titles.map(t => `<li>${t}</li>`).join("")}
        </ul>
      </body>
    </html>
  `);

  w.document.close();
  w.print();
}



  useEffect(() => {
    load();
    loadEventStatus();
    const t = setInterval(load, 1500);
    const t2 = setInterval(loadEventStatus, 2000);

  return () => {
    clearInterval(t);
    clearInterval(t2);
  };
}, [code]);

  async function createEvent() { 
  const eventCode = makeEventCodeFromName(eventName);
  if (!eventCode) return;



  const password = prompt("Password per creare evento:");
  if (!password) return;

  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventCode, password }),
  });

  if (!res.ok) {
    alert("Password errata o errore creazione evento");
    return;
  }

  window.location.href = `/dj/${eventCode}`;
}

async function loadEventStatus() {
  if (!code || code === "TEST123") return;

  try {
    const res = await fetch(`/api/events?eventCode=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setTidalConnected(!!data.tidal_connected);
    setTidalChecked(true);
  } catch {
    setTidalChecked(true);
  }
}

async function disconnectTidal() {
  const res = await fetch("/api/tidal/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventCode: code }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    alert("Errore scollegamento TIDAL");
    return;
  }

  setTidalConnected(false);
  setTidalChecked(true);
}

async function joinExistingEvent() {
  const safe = joinCode.trim().toUpperCase().replace(/\s+/g, "-");
  if (!safe) return;

  setJoinMsg("");

  try {
    const res = await fetch(`/api/events?eventCode=${encodeURIComponent(safe)}`, {
      cache: "no-store",
    });

    if (res.status === 200) {
      window.location.href = `/dj/${safe}`;
      return;
    }

    if (res.status === 410) {
      setJoinMsg("⏳ Evento scaduto (creane uno nuovo).");
      return;
    }

    setJoinMsg("❌ Evento non trovato.");
  } catch {
    setJoinMsg("⚠️ Errore di rete.");
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

const toggleTidalSelected = async (r: RequestItem) => {
  if (!r.tidal_url) return;

  const nextValue = !Boolean(r.tidal_selected);

  const res = await fetch("/api/requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: r.id,
      tidal_selected: nextValue,
    }),
  });

  if (!res.ok) {
    alert("Errore selezione playlist");
    return;
  }

  setItems((prev) =>
    prev.map((x) =>
      x.id === r.id ? { ...x, tidal_selected: nextValue } : x
    )
  );
};

const saveBpm = async (id: string) => {
  const v = bpmEdit[id];

  // niente valore -> non fare nulla
  if (v === "" || v === undefined) return;

  const bpmNum = Number(v);
  if (!Number.isFinite(bpmNum) || bpmNum <= 0 || bpmNum > 300) {
    alert("BPM non valido");
    return;
  }

  const r = await fetch("/api/requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, bpm: Math.round(bpmNum) }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    alert("Errore BPM" + (txt ? `: ${txt}` : ""));
    return;
  }

  const data = await r.json().catch(() => null);
  const updated = data?.request; // <- backend ti ritorna request aggiornata

  // aggiorna lista in memoria (niente reload)
  setItems((prev) =>
    prev.map((x) => (x.id === id ? { ...x, ...(updated ?? {}), bpm: Math.round(bpmNum) } : x))
  );

  // chiudi l'edit (sparisce input, resta badge)
  setBpmEdit((prev) => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
};

async function exportPlaylist() {
  const selectedTracks = sorted.filter(
  (r) => Boolean(r.tidal_selected) && Boolean(r.tidal_url) && !Boolean(r.tidal_synced)
);

  if (selectedTracks.length === 0) {
    alert("Nessun brano esportabile selezionato.");
    return;
  }

  try {
    // 1. crea playlist se manca
    const createRes = await fetch("/api/tidal/create-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventCode: code }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok || !createJson.ok) {
      alert("Errore creazione playlist TIDAL");
      console.error("CREATE PLAYLIST ERROR:", createJson);
      return;
    }

    // 2. aggiungi i brani selezionati
    for (const r of selectedTracks) {
      const match = String(r.tidal_url).match(/track\/(\d+)/);
      const trackId = match?.[1];

      if (!trackId) {
        console.warn("Track ID non trovato per:", r.tidal_url);
        continue;
      }

      const addRes = await fetch("/api/tidal/add-track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventCode: code,
          trackId,
        }),
      });

      const addJson = await addRes.json();
if (!addRes.ok || !addJson.ok) {
  console.error("ADD TRACK ERROR FULL:", JSON.stringify({
    title: r.title,
    trackId,
    response: addJson,
  }, null, 2));

  alert(
    `Errore add-track\nTitolo: ${r.title}\nTrackId: ${trackId}\nDettagli: ${JSON.stringify(addJson)}`
  );
}
    }

    alert("Playlist TIDAL esportata con successo 🎧");
  } catch (err) {
    console.error("EXPORT PLAYLIST ERROR:", err);
    alert("Errore export playlist");
  }
}


function toggleSelect(id: string) {
  setSelected((prev) => ({
    ...prev,
    [id]: !prev[id],
  }));
}


  return (
    <div className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100 overflow-hidden">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-56 right-[-160px] h-[600px] w-[600px] rounded-full bg-pink-400/20 blur-[140px]" />

      <div className="mx-auto max-w-[1600px] px-4 py-8">
        {/* HEADER TOP */}
        <div className="mb-6 flex flex-col gap-4 md:gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 md:justify-center">
             {/* Logo AskDJ (animato) */}
<div className="flex items-center gap-4">
  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400">
    {/* glow animato dietro */}
    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-yellow-400/50 blur-xl animate-pulse" />
    <div className="pointer-events-none absolute -inset-1 rounded-2xl border border-yellow-300/60 animate-pulse" />

    {/* icon */}
    <span className="relative text-2xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">
      🎧
    </span>
  </div>

  <div className="leading-tight">
    <div className="text-4xl font-black tracking-tight">
      <span className="text-yellow-400">Ask</span>
      <span className="text-white">DJ</span>
    </div>
    <div className="text-xs text-zinc-400 tracking-wide">
      Music Requests
    </div>
  </div>
</div>



{/* Titolo */}
<div className="min-w-0 sm:ml-4 lg:ml-32">
  <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight break-words gap-6">
   Console <span className="text-yellow-400">DJ</span>
  </div>

  <div className="mt-1 md:mt-3 text-xs sm:text-sm text-zinc-400 tracking-wide leading-snug">
    Richieste e dediche in tempo reale
  </div>
  </div>

   </div>
{code && code !== "TEST123" && (
  <div className="mt-2 flex flex-wrap items-center gap-4 lg:ml-8">
    <span className="text-yellow-400 font-extrabold tracking-widest text-xl sm:text-sm gap-4">
      EVENTO:
    </span>

    <span
     className="
      inline-flex items-center
      px-4 py-1.5
      rounded-full
      text-sm sm:text-base
      font-bold
      tracking-widest
      bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300
      text-zinc-900
      shadow-[0_0_12px_rgba(34,211,238,0.35)]
      "
    >
      {code}
    </span>
  </div>
)}



          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mt-6 ">

            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Gestisci le richieste <span className="text-yellow-400">senza caos</span>
              </h1>

               <FakeSpectrumWide />


            <p className="mt-4 text-lg text-zinc-300 max-w-2xl">
              Crea un EVENTO... Condividi il QR... Ricevi i brani e dediche in una lista ordinata...
               Tu decidi cosa suonare...
            </p>

            <div className="mt-3 h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
            <div className="mt-[-3px] h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />


              {/* INIZIA QUI */}
            {code ! == "TEST123" && (           
             <div className="mt-6 rounded-2xl border border-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.25)] px-4 py-4">
            <p className="text-sm font-extrabold text-cyan-400 mb-3 tracking-wide">
             INIZIA QUI 👇
             </p>

             <ol className="mt-1 text-sm text-zinc-200 list-decimal pl-5 space-y-1">
             <li>Scrivi un nome evento e premi <b>Crea Evento</b></li>
             <li>Quando l’evento è attivo, <b>stampa il QR</b></li>
             <li>Gli ospiti lo scansionano e inviano richieste</li>
             </ol>

            <div className="mt-3 text-xs text-yellow-300 leading-snug">
             ⚠️ Gli ospiti NON entrano da questa pagina.  
              Entrano solo scansionando il QR dell’evento.
            </div>
          </div>
         )}
        </div>

        {code && code !== "TEST123" && tidalChecked && (
        <div className="mb-4 flex flex-col items-end gap-2">
         {tidalConnected ? (
         <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
         ✅ TIDAL collegato
       </div>

    <button
      onClick={disconnectTidal}
      className="rounded-md bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/40"
    >
      Scollega TIDAL
    </button>
  </div>
) : (
      <a
        href={`/api/tidal/connect?eventCode=${encodeURIComponent(code)}`}
        title="Collega il tuo account TIDAL per usare i brani matchati nell’evento"
        className="inline-flex items-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-300 transition"
      >
        🔗 Collega TIDAL
      </a>
    )}
  </div>
)}

            {/* create event */}
            <div className="flex flex-col gap-2 sm:flex-col sm:items-end">
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Scrivi: Nome Nuovo Evento..."
                className="w-full sm:w-72 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20 transition"

              />
              <button
                onClick={createEvent}
                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_26px_rgba(34,211,238,0.18)] hover:brightness-110 transition"

              >
                CREA NUOVO EVENTO
              </button>
            </div>
          </div>
          {/* join event */}
          <div className="flex flex-col gap-2 sm:flex-col sm:items-end mt-4">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Scrivi: Nome Evento Esistente..."
              className="w-full sm:w-72 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-pink-400/70 focus:ring-2 focus:ring-pink-400/20 transition"

            />
            <button
              onClick={joinExistingEvent}
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_22px_rgba(251,113,133,0.18)] hover:brightness-110 transition"

            >
              RIENTRA IN EVENTO 
            </button>
          </div>

           {joinMsg && (
          <div className="mt-2 text-sm text-zinc-400">
          {joinMsg}
         </div>
        )}


          {/* mode buttons */}
          <div className="flex gap-4 justify-center">
            <ModeButton
              active={mode === "dj"}
              onClick={() => {
                resetPartyUnlock();
                setMode("dj");
              }}

              icon="🎛"
              label="DJ"
              variant="dj"
            />
            <ModeButton
              active={mode === "party"}
              onClick={() => {
                resetPartyUnlock();
                setMode("party");
              }}

              icon="🎉"
              label="Party"
              variant="party"
            />
          </div>
        </div>
    

    {/* Spiegazione DJ / Party (mostra solo prima che esista un evento vero) */}
{code === "TEST123" && (
  <div className="mt-3 rounded-2xl border border-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.25)] p-3 text-center">
    <div className="text-xs font-extrabold text-cyan-300"> 🎧 👆   - Cosa cambia -   👆 🎉 </div>

    <div className="mt-2 text-xs text-zinc-200">
      <span className="font-bold">DJ:</span> gestisci la coda, apri i link e decidi cosa suonare.
    </div>

    <div className="mt-1 text-xs text-zinc-200">
      <span className="font-bold">Party:</span> modalità “festa”: apri i link e fai partire la musica in sequenza.
    </div>

    <div className="mt-2 text-[11px] text-yellow-300">
      Dopo che crei l’evento, questa guida sparisce.
    </div>
  </div>
)}



        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2">
            {mode === "party" ? (
              <section className="rounded-3xl border border-yellow-400/40 bg-zinc-950/70 shadow-[0_0_35px_rgba(253,224,71,0.35)] p-2 sm:p-3 ">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-4 text-xs text-cyan-400">
                  <span className="pl-4 min-w-0 truncate">Modalità Party:Autoplay YouTube</span>
                  <a
                    href={`/party/${code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap pr-4 text-cyan-400 hover:underline"
                  >
                    Apri-Fullscreen👉
                  </a>
                 </div>


                <div className="rounded-3xl border border-yellow-400/40 bg-zinc-950/70 p-2 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.45)]">
                   <iframe
                    src={`/party/${code}`}
                  className="h-[82vh] w-full rounded-2xl bg-zinc-950"
                 allow="autoplay; encrypted-media; picture-in-picture"
                />
              </div>

              </section>
            ) : (
<>
<div className="mt-3 mb-2 flex items-center gap-3 pl-2 text-sm font-bold text-yellow-300">
  ⭐ Playlist selezionata:
  <span className="rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-extrabold text-black">
    {sorted.filter((r) => Boolean(r.tidal_selected) && r.tidal_url && !r.tidal_synced).length}
  </span>

  <button
    onClick={exportPlaylist}
    className="ml-3 rounded-md bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/40"
  >
     🎧 Export Playlist
  </button>
</div>


              <section className="mt-3 rounded-3xl border border-yellow-400 bg-emerald-400/8 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
               <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
  
                  <div className="min-w-0">
                    <div className="pl-4 pt-2 text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-cyan-400 to-pink-400">
                      CONSOLE DJ:
                    </div>
                    <div className="pl-4 pt-1 text-xs text-amber-300">
                      Seleziona i Brani:
                    </div>
                  </div>

                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                   <div className="pl-3 sm:pl-0 whitespace-nowrap text-sm font-bold text-cyan-600 gap-2">
                    <span className="text-white">- </span>Classifica<span className="text-white">: 👇</span><span className="text-white">- </span>Voti<span className="text-white">: 🔥</span><span className="text-white">- </span>Link<span className="text-white">: 🎵</span>
                    </div>

                   <div className="pl-3 sm:pl-0 flex items-center justify-start gap-3 mt-2 sm:mt-0 sm:justify-end w-full sm:w-auto">
                   <span className="text-xs text-yellow-300 gap-2">TROVA BPM:</span>

  <input
    type="number"
    inputMode="numeric"
    value={bpmDraft}
    onChange={(e) => setBpmDraft(e.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter") confirmBpmTarget(); }}
    placeholder={bpmTarget ? String(bpmTarget) : "Es. 128"}
    className={`w-20 rounded-xl px-2 py-1 text-xs text-center ${zoneClass(targetZone(bpmTarget))}`}
  />

  <button
    onClick={confirmBpmTarget}
    className="rounded-lg bg-yellow-500/20 px-2 py-1 text-xs hover:bg-yellow-500/40"
    title="Conferma BPM"
  >
    OK
  </button>
  </div>
  <div className="mt-3 mb-3 px-2 sm:px-0 flex justify-center sm:mt-1 sm:justify-end sm:ml-3 sm:pr-2 md:pr-3 pt-3 sm:pt-0">
  <button
    onClick={printPlaylist}
    className="rounded-md px-3 py-1 text-xs leading-none font-bold text-zinc-900 bg-gradient-to-r from-amber-300 to-yellow-400 hover:opacity-90"
  >
    🖨️ Stampa Playlist ▼
  </button>
</div>
                </div>
                  </div>

                {sorted.length === 0 ? (
                  <div className="mx-1 rounded-3xl border border-yellow-400 bg-zinc-900/40 p-4 pt-6 text-sm text-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    <div className="font-semibold text-zinc-100">
                      ⚠️ Evento scaduto o vuoto!
                    </div>
                    <div className="mt-1 text-zinc-400">
                      NESSUN VIDEO RICEVUTO - CREA NUOVO EVENTO.
                      invia una canzone dall’area ospiti.
                    </div>
                  </div>
                ) : (


  <ul className="space-y-3 pb-3">
  {sorted.map((r, idx) => {
    const isNew = Date.now() - r.updatedAt < 2000;

    return (
      <li
        key={r.id}
        className={`mx-1 rounded-3xl overflow-hidden border p-4 pt-6 shadow-[0_14px_45px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${
          r.tidal_url
            ? "border-green-400 bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.35)] hover:border-green-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
            : "border-yellow-400/40 bg-zinc-950 hover:border-yellow-300"
        } ${isNew ? "animate-[pulse_1.2s_ease-out_2] border-yellow-300" : ""}`}
      >
        <div className="flex gap-3">
<button
  onClick={() => !r.tidal_synced && toggleTidalSelected(r)}
  disabled={!r.tidal_url || Boolean(r.tidal_synced)}
  className={`text-xl leading-none select-none transition ${
    r.tidal_synced
      ? "cursor-not-allowed text-cyan-400 opacity-90"
      : r.tidal_url
      ? "cursor-pointer text-white hover:scale-110"
      : "cursor-not-allowed text-zinc-600 opacity-50"
  }`}
  title={
    r.tidal_synced
      ? "Già esportato su TIDAL"
      : r.tidal_url
      ? "Seleziona per playlist TIDAL"
      : "Non esportabile"
  }
>
  {r.tidal_synced ? "🔵" : Boolean(r.tidal_selected) ? "⭐" : "☆"}
</button>

<div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">


          {/* SINISTRA: titolo */}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-zinc-500">#{idx + 1}</div>

            <div className="truncate text-base font-extrabold text-zinc-100">
              {r.title}
            </div>

            {(() => {
              const dedications = splitDedications(r.dedication);
              const count = dedications.length;

              if (count === 0) return null;

              if (count === 1) {
                return (
                  <div className="mt-1 text-xs italic text-rose-400">
                    💬 DEDICA: <span className="text-white">❤️ {dedications[0]}</span>
                  </div>
                );
              }

              const isOpen = !!openDedications[r.id];

              return (
                <div className="mt-2">
                  <button
                    type="button"
                    title="Apri"
                    onClick={() =>
                      setOpenDedications((prev) => ({
                        ...prev,
                        [r.id]: !prev[r.id],
                      }))
                    }
                    className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-300 hover:text-rose-200"
                  >
                    💬 DEDICHE: <span className="font-extrabold text-yellow-400">{count}</span> {isOpen ? "▾" : "▸"}
                  </button>

                  {isOpen && (
                    <div className="mt-2 rounded-xl border border-rose-400 bg-zinc-900/60 px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {dedications.map((d, i) => (
                          <div key={i} className="text-xs italic text-white">
                            ❤️ {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* DESTRA: pillole/bottoni */}
          <div className="flex items-center gap-1.5 sm:gap-2 sm:flex-nowrap sm:justify-end sm:shrink-0">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-extrabold text-zinc-200 shadow-[0_10px_25px_rgba(0,0,0,0.25)]">
              🔥 {r.votes}
            </span>

            <PlatformButton r={r} />
            <TidalSearchButton r={r} />

            <div className="ml-2 flex items-center gap-2">
              {/* BPM UX: badge se salvato, input solo quando serve */}
              {(() => {
                const saved = typeof (r as any).bpm === "number" ? Math.round((r as any).bpm) : null;

                let songBpmClass = "bg-cyan-500/20";

                if (bpmTarget && saved !== null) {
                  const diff = Math.abs(saved - bpmTarget);
                  const zone = targetZone(bpmTarget);

                  if (diff <= 5) {
                    songBpmClass =
                      zone === "low"
                        ? "bg-green-500/35 ring-2 ring-green-400"
                        : zone === "mid"
                        ? "bg-yellow-500/35 ring-2 ring-yellow-400"
                        : zone === "high"
                        ? "bg-sky-500/35 ring-2 ring-sky-400"
                        : "bg-red-500/35 ring-2 ring-red-400";
                  } else if (diff <= 10) {
                    songBpmClass =
                      zone === "low"
                        ? "bg-green-500/20 ring-1 ring-green-400/60"
                        : zone === "mid"
                        ? "bg-yellow-500/20 ring-1 ring-yellow-400/60"
                        : zone === "high"
                        ? "bg-sky-500/20 ring-1 ring-sky-400/60"
                        : "bg-red-500/20 ring-1 ring-red-400/60";
                  } else {
                    songBpmClass = "bg-zinc-800/40";
                  }
                }

                const editing = Object.prototype.hasOwnProperty.call(bpmEdit, r.id);

                if (saved !== null && !editing) {
                  return (
                    <button
                      onClick={() => setBpmEdit((prev) => ({ ...prev, [r.id]: saved }))}
                      className={`rounded-md px-2 py-1 text-xs ${songBpmClass} transition hover:opacity-90`}
                      title="Modifica BPM"
                    >
                      {saved} BPM
                    </button>
                  );
                }

                return (
                  <>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bpmEdit[r.id] ?? ""}
                      onChange={(e) =>
                        setBpmEdit((prev) => ({
                          ...prev,
                          [r.id]: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      placeholder="BPM"
                      className="w-16 rounded-md border border-yellow-400/30 bg-zinc-900 px-2 py-1 text-xs"
                    />

                    <button
                      onClick={() => saveBpm(r.id)}
                      className="rounded-md bg-yellow-500/20 px-2 py-1 text-xs hover:bg-yellow-500/40"
                      title="Salva BPM"
                    >
                      OK
                    </button>

                    {saved !== null && (
                      <button
                        onClick={() =>
                          setBpmEdit((prev) => {
                            const copy = { ...prev };
                            delete copy[r.id];
                            return copy;
                          })
                        }
                        className="rounded-md bg-zinc-800/60 px-2 py-1 text-xs hover:bg-zinc-800"
                        title="Annulla"
                      >
                        ✖
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              onClick={() => deleteRequest(r.id)}
              className="ml-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 opacity-70 hover:text-red-400 hover:opacity-100"
              title="Elimina"
            >
              🗑️
            </button>
          </div>
          </div>
        </div>
      </li>
    );
  })}
</ul>
  )}
   </section>
   </>
  )}
 </div>

          {/* RIGHT: QR */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 p-[1px] rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900/80 via-zinc-900/70 to-zinc-900/80 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">

             <div className="rounded-3xl 
                border border-yellow-400/80 
                bg-zinc-800/40 
                backdrop-blur 
                p-4 overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.25)]">


              <div className="mb-3">
                <div className="text-lg font-extrabold text-yellow-300">
                  INVITA GLI OSPITI (QR):
                </div>
                <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-cyan-400 to-pink-200">Scansionano QR 👉 inviano link canzone 👉 Il DJ le vede qui</div>
              </div>

             <div className="mt-2 flex justify-center">
              <EventQr eventCode={code} />
              </div>


               <p className="mt-3 text-xs text-yellow-300 text-center">
               ⚠️ Gli ospiti NON entrano da DJ/Party.  
               Devono scansionare questo QR.
              </p>

            </div>
           </div> 
          </aside>
        </div>
      </div>
 {/* Footer */}
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
  );
}
