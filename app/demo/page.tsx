"use client";

import { useEffect, useMemo, useState } from "react";

type DemoItem = {
  id: string;
  title: string;
  votes: number;
  dedication: string;
  platform: "youtube";
  bpm: number;
  isNew?: boolean;
};

const initialRequests: DemoItem[] = [
  {
    id: "1",
    title: "Avicii - Levels",
    votes: 12,
    dedication: "Per Vale ❤️",
    platform: "youtube",
    bpm: 126,
  },
  {
    id: "2",
    title: "Gigi D'Agostino - L’Amour Toujours",
    votes: 9,
    dedication: "Vecchia scuola 🔥",
    platform: "youtube",
    bpm: 138,
  },
  {
    id: "3",
    title: "Black Eyed Peas - I Gotta Feeling",
    votes: 7,
    dedication: "Serata top 🎉",
    platform: "youtube",
    bpm: 128,
  },
  {
    id: "4",
    title: "David Guetta & Sia - Titanium",
    votes: 6,
    dedication: "Per tutti 💛",
    platform: "youtube",
    bpm: 126,
  },
];

const fakePool: Omit<DemoItem, "id" | "votes" | "isNew">[] = [
  {
    title: "Eiffel 65 - Blue",
    dedication: "Nostalgia pura 💙",
    platform: "youtube",
    bpm: 128,
  },
  {
    title: "Pitbull - Give Me Everything",
    dedication: "Spingi forte 🔥",
    platform: "youtube",
    bpm: 129,
  },
  {
    title: "Swedish House Mafia - Don’t You Worry Child",
    dedication: "Per gli amici 🎶",
    platform: "youtube",
    bpm: 129,
  },
  {
    title: "The Killers - Mr. Brightside",
    dedication: "Questa la sanno tutti 😎",
    platform: "youtube",
    bpm: 148,
  },
];

function DemoBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "yellow" | "cyan";
}) {
  const map = {
    default: "bg-zinc-800 text-zinc-200",
    yellow: "bg-yellow-400 text-zinc-950",
    cyan: "bg-cyan-400 text-zinc-950",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-[0_10px_25px_rgba(0,0,0,0.25)] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export default function DemoPage() {
  const [items, setItems] = useState<DemoItem[]>(initialRequests);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<"dj" | "party">("dj");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));
  }, [items]);

  function showToast(msg: string) {
    setToast(msg);
  }

  function voteUp(id: string) {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );
    showToast("🔥 Voto aggiunto (demo)");
  }

  function addFakeRequest() {
    const random = fakePool[Math.floor(Math.random() * fakePool.length)];
    const id = `${Date.now()}`;

    const next: DemoItem = {
      id,
      title: random.title,
      dedication: random.dedication,
      platform: "youtube",
      bpm: random.bpm,
      votes: 1,
      isNew: true,
    };

    setItems((prev) => [next, ...prev]);
    showToast("⚡ Nuova richiesta arrivata");
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);


  useEffect(() => {
    if (!guideOpen) return;
    if (guideStep > 2) setGuideStep(0);
  }, [guideOpen, guideStep]);

  return (
    <div className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {toast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 left-[-140px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[120px]" />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 relative z-10">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-yellow-400/50 blur-xl animate-pulse" />
                <div className="pointer-events-none absolute -inset-1 rounded-2xl border border-yellow-300/60 animate-pulse" />
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
                  Demo Console
                </div>
              </div>
            </div>

            <div className="min-w-0 sm:ml-4 lg:ml-28">
              <div className="text-3xl sm:text-4xl lg:text-7xl font-black tracking-tight text-white leading-tight break-words">
                Console <span className="text-yellow-400">DJ</span>
              </div>

              <div className="mt-1 md:mt-3 text-xs sm:text-sm text-zinc-400 tracking-wide leading-snug">
                ...demo vetrina interattiva...
              </div>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-4 lg:ml-24">
            <span className="text-yellow-400 font-extrabold tracking-widest text-sm sm:text-sm">
              EVENTO:
            </span>

            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm sm:text-base font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300 text-zinc-900 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
              DEMO PARTY NIGHT
            </span>

            <DemoBadge tone="cyan">⚡ SIMULAZIONE LIVE</DemoBadge>
          </div>
        </div>

        {/* HERO INFO */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Guarda cosa può fare <span className="text-yellow-400">AskDJ</span>
            </h1>

            <p className="mt-4 text-lg text-zinc-300 max-w-2xl">
              Questa demo simula la console DJ: richieste, dediche, classifica,
              QR ospiti e reazione live del pannello.
            </p>

            <div className="mt-3 h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-90" />
            <div className="mt-[-3px] h-[3px] w-28 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px] opacity-70" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={addFakeRequest}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400 px-5 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_26px_rgba(34,211,238,0.18)] hover:brightness-110 transition"
            >
              ➕ Simula richiesta ospite
            </button>

            <button
              onClick={() => setGuideOpen((v) => !v)}
              className="rounded-2xl border border-yellow-400/50 bg-yellow-500/10 px-5 py-3 text-sm font-extrabold text-yellow-300 hover:bg-yellow-500/20 transition"
            >
              💡 {guideOpen ? "Chiudi guida" : "Guida demo"}
            </button>

            <button
              onClick={() => (window.location.href = "/dj/TEST123")}
              className="rounded-2xl bg-zinc-900/70 px-5 py-3 text-sm font-extrabold text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-800 transition"
            >
              🎛️ Vai alla console vera
            </button>
          </div>
        </div>

        {/* GUIDE */}
        {guideOpen && (
          <div className="mb-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 shadow-[0_0_18px_rgba(34,211,238,0.16)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-extrabold text-cyan-300">
                  GUIDA DEMO
                </div>

                {guideStep === 0 && (
                  <div className="mt-1 text-sm text-zinc-200">
                    Qui il DJ vede le richieste inviate dagli ospiti, già ordinate per voti.
                  </div>
                )}

                {guideStep === 1 && (
                  <div className="mt-1 text-sm text-zinc-200">
                    Ogni brano può avere dedica, voti e info utili per decidere cosa suonare.
                  </div>
                )}

                {guideStep === 2 && (
                  <div className="mt-1 text-sm text-zinc-200">
                    Gli ospiti entrano dal QR, inviano il link, e il DJ lo vede subito in console.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setGuideStep((s) => (s === 0 ? 2 : s - 1))}
                  className="rounded-xl bg-zinc-900/70 px-3 py-2 text-xs font-extrabold text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800"
                >
                  ◀
                </button>

                <button
                  onClick={() => setGuideStep((s) => (s === 2 ? 0 : s + 1))}
                  className="rounded-xl bg-zinc-900/70 px-3 py-2 text-xs font-extrabold text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-800"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE BUTTONS */}
        <div className="mb-5 flex gap-4 justify-center">
          <button
            onClick={() => setMode("dj")}
            className={[
              "rounded-full px-6 py-3 text-sm font-extrabold transition inline-flex items-center justify-center gap-2 min-w-[140px] ring-1",
              mode === "dj"
                ? "bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950 ring-emerald-300/40 shadow-[0_0_25px_rgba(52,211,153,0.20)]"
                : "bg-zinc-900/60 text-zinc-200 ring-zinc-700 hover:bg-zinc-800",
            ].join(" ")}
          >
            🎛 DJ
          </button>

          <button
            onClick={() => setMode("party")}
            className={[
              "rounded-full px-6 py-3 text-sm font-extrabold transition inline-flex items-center justify-center gap-2 min-w-[140px] ring-1",
              mode === "party"
                ? "bg-gradient-to-r from-amber-300 to-orange-400 text-zinc-950 ring-amber-300/40 shadow-[0_0_25px_rgba(251,191,36,0.22)]"
                : "bg-zinc-900/60 text-zinc-200 ring-zinc-700 hover:bg-zinc-800",
            ].join(" ")}
          >
            🎉 Party
          </button>
        </div>

        {/* WHAT CHANGES */}
        {mode === "dj" ? (
          <div className="mb-5 rounded-2xl border border-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.25)] p-3 text-center">
            <div className="text-xs font-extrabold text-cyan-300">
              🎧 MODALITÀ DJ
            </div>
            <div className="mt-2 text-xs text-zinc-200">
              Il DJ gestisce la coda, apre i link, controlla i voti e decide cosa suonare.
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.25)] p-3 text-center">
            <div className="text-xs font-extrabold text-cyan-300">
              🎉 MODALITÀ PARTY
            </div>
            <div className="mt-2 text-xs text-zinc-200">
              In Party Mode la coda vive da sola: i brani possono scorrere in autoplay.
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2">
            {mode === "party" ? (
              <section className="rounded-3xl border border-yellow-300/50 bg-zinc-950/70 shadow-[0_0_35px_rgba(253,224,71,0.28)] p-2 sm:p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-4 text-xs">
                  <span className="pl-4 min-w-0 truncate font-semibold text-cyan-300">
                    Party Mode · Simulazione autoplay YouTube
                  </span>
                  <span className="whitespace-nowrap pr-4 font-medium text-cyan-300">
                    Demo interattiva
                  </span>
                </div>

                <div className="rounded-3xl border border-yellow-300/40 bg-zinc-950/70 p-5 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.45)]">
                  <div className="aspect-video w-full rounded-2xl border border-yellow-400/30 bg-black/80 grid place-items-center">
                    <div className="text-center px-4">
                      <div className="text-lg font-extrabold text-yellow-300">
                        ▶ Party in esecuzione
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">
                        Qui nella versione reale partono i link YouTube degli ospiti.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <DemoBadge>🔁 Loop ON</DemoBadge>
                    <DemoBadge>⏭ Avanti</DemoBadge>
                    <DemoBadge tone="yellow">⚡ Autoplay</DemoBadge>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <div className="mt-3 mb-2 flex items-center gap-3 pl-2 text-sm font-bold text-yellow-300">
                  ⭐ Playlist selezionata:
                  <span className="rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-extrabold text-black">
                    2
                  </span>

                  <button
                    onClick={() => showToast("🎧 Demo: Export Playlist simulato")}
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
                        Demo richieste ospiti
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="pl-3 sm:pl-0 whitespace-nowrap text-sm font-bold text-cyan-600 gap-2">
                        <span className="text-white">- </span>Classifica
                        <span className="text-white">: 👇 </span>
                        <span className="text-white">- </span>Voti
                        <span className="text-white">: 🔥 </span>
                        <span className="text-white">- </span>Link
                        <span className="text-white">: 🎵</span>
                      </div>

                      <div className="mt-3 mb-3 px-2 sm:px-0 flex justify-center sm:mt-1 sm:justify-end sm:ml-3 sm:pr-2 md:pr-3 pt-3 sm:pt-0">
                        <button
                          onClick={() => showToast("🖨️ Demo: stampa simulata")}
                          className="rounded-md px-3 py-1 text-xs leading-none font-bold text-zinc-900 bg-gradient-to-r from-amber-300 to-yellow-400 hover:opacity-90"
                        >
                          🖨️ Stampa Playlist ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 pb-3">
                    {sorted.map((r, idx) => {
                      const isTop = idx === 0;

                      return (
                        <li
                          key={r.id}
                          className={`mx-1 rounded-3xl overflow-hidden border p-4 pt-6 shadow-[0_14px_45px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${
                            isTop
                              ? "border-yellow-300 bg-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                              : "border-yellow-400/40 bg-zinc-950 hover:border-yellow-300"
                          } ${r.isNew ? "animate-[pulse_1.2s_ease-out_2]" : ""}`}
                        >
                          <div className="flex gap-3">
                            <button
                              onClick={() => showToast("⭐ Demo: selezione playlist")}
                              className="text-xl leading-none select-none transition text-white hover:scale-110"
                              title="Seleziona per playlist"
                            >
                              {idx < 2 ? "⭐" : "☆"}
                            </button>

                            <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-zinc-500">
                                  #{idx + 1} {isTop ? "· TOP" : ""}
                                </div>

                                <div className="truncate text-base font-extrabold text-zinc-100">
                                  {r.title}
                                </div>

                                <div className="mt-2 text-xs italic text-rose-400">
                                  💬 DEDICA: <span className="text-white">❤️ {r.dedication}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 sm:gap-2 sm:flex-nowrap sm:justify-end sm:shrink-0">
                                <span
                                  title="I voti arrivano dagli ospiti nella pagina evento"
                                  className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-extrabold text-zinc-200 shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
                                >
                                 🔥 {r.votes}
                                </span>

                                <button
                                  onClick={() => showToast("▶ Demo: apertura YouTube simulata")}
                                  className="rounded-xl px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:opacity-90 transition shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                                >
                                  ▶ YouTube
                                </button>

                                <button
                                  onClick={() => showToast("🔎 Demo: ricerca simulata")}
                                  className="rounded-xl px-2.5 py-2 text-xs font-semibold transition shadow-[0_6px_18px_rgba(0,0,0,0.25)] bg-yellow-400 text-black hover:bg-yellow-300"
                                >
                                  🔎
                                </button>

                                <button
                                  onClick={() => showToast(`🎚️ BPM demo: ${r.bpm}`)}
                                  className="rounded-md px-2 py-1 text-xs bg-cyan-500/20 transition hover:opacity-90"
                                  title="BPM demo"
                                >
                                  {r.bpm} BPM
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </>
            )}
          </div>

          {/* RIGHT */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 p-[1px] rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900/80 via-zinc-900/70 to-zinc-900/80 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="rounded-3xl border border-yellow-400/80 bg-zinc-800/40 backdrop-blur p-4 overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.25)]">
                <div className="mb-3">
                  <div className="text-lg font-extrabold text-yellow-300">
                    INVITA GLI OSPITI (QR):
                  </div>
                  <div className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-cyan-300 to-emerald-300">
                    Scansionano QR 👉 inviano link canzone 👉 Il DJ le vede qui
                  </div>
                </div>

                <div className="mt-2 flex justify-center">
                  <div className="h-44 w-44 rounded-2xl bg-white grid place-items-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <div className="h-32 w-32 bg-[linear-gradient(90deg,#000_10%,transparent_10%,transparent_20%,#000_20%,#000_30%,transparent_30%,transparent_40%,#000_40%,#000_50%,transparent_50%,transparent_60%,#000_60%,#000_70%,transparent_70%,transparent_80%,#000_80%)] opacity-90" />
                  </div>
                </div>

                <p className="mt-3 text-xs text-yellow-300 text-center">
                  ⚠️ Nella versione reale gli ospiti entrano da qui, non dalla console DJ.
                </p>

                <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                  <div className="text-sm font-extrabold text-cyan-300">
                    COSA FA ASKDJ
                  </div>

                  <div className="mt-2 space-y-2 text-xs text-zinc-200 leading-relaxed">
                    <div>• raccoglie richieste e dediche</div>
                    <div>• mostra classifica e voti</div>
                    <div>• aiuta il DJ a decidere cosa suonare</div>
                    <div>• può creare una playlist TIDAL evento</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

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
    </div>
  );
}