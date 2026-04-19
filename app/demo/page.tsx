"use client";

const fakeRequests = [
  {
    id: "1",
    title: "David Guetta & Sia - Titanium",
    votes: 12,
    dedication: "Per Vale ❤️",
  },
  {
    id: "2",
    title: "Gigi D'Agostino - L'Amour Toujours",
    votes: 9,
    dedication: "Vecchia scuola 🔥",
  },
  {
    id: "3",
    title: "Black Eyed Peas - I Gotta Feeling",
    votes: 15,
    dedication: "Serata bomba 🎉",
  },
  {
    id: "4",
    title: "Avicii - Levels",
    votes: 7,
    dedication: "Per tutti 💛",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-pink-400/15 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-4 py-10 relative z-10">
        <div className="text-center">
          <div className="text-sm font-extrabold tracking-[0.25em] text-cyan-300">
            DEMO VETRINA
          </div>

          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Guarda come funziona <span className="text-yellow-400">AskDJ</span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-zinc-300">
            Questa è una simulazione della console DJ: richieste live, voti e dediche,
            in una vista pulita e immediata.
          </p>

          <div className="mt-3 text-xs text-zinc-400">
            Nessuna API, nessun evento reale: solo una vetrina interattiva.
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <section className="rounded-3xl border border-yellow-400/40 bg-zinc-950/80 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
              <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-pink-400">
                    CONSOLE DJ
                  </div>
                  <div className="mt-1 text-xs text-yellow-300">
                    Demo simulata delle richieste ospiti
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-extrabold text-zinc-200">
                    🔥 Live Votes
                  </span>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-extrabold text-zinc-200">
                    💬 Dediche
                  </span>
                </div>
              </div>

              <ul className="space-y-3 px-3 pb-4">
                {fakeRequests.map((r, i) => (
                  <li
                    key={r.id}
                    className="rounded-3xl border border-yellow-400/30 bg-zinc-950 p-4 shadow-[0_14px_45px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex gap-3 items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-500">#{i + 1}</div>

                        <div className="truncate text-base font-extrabold text-zinc-100">
                          {r.title}
                        </div>

                        <div className="mt-2 text-xs italic text-rose-400">
                          💬 DEDICA: <span className="text-white">❤️ {r.dedication}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-extrabold text-zinc-200">
                          🔥 {r.votes}
                        </span>

                        <button
                          disabled
                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white opacity-70 cursor-not-allowed"
                        >
                          ▶ YouTube
                        </button>

                        <button
                          disabled
                          className="rounded-xl bg-yellow-400 px-2.5 py-2 text-xs font-semibold text-black opacity-70 cursor-not-allowed"
                        >
                          🔎
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-yellow-400/40 bg-zinc-950/80 p-5 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
              <div className="text-lg font-extrabold text-yellow-300">
                COSA VEDI QUI
              </div>

              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div>🎧 Richieste ordinate in tempo reale</div>
                <div>🔥 Voti per far salire i brani</div>
                <div>💬 Dediche visibili al DJ</div>
                <div>📱 Accesso ospiti via QR code</div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                <div className="text-sm font-extrabold text-cyan-300">
                  Vuoi provarlo davvero?
                </div>
                <div className="mt-2 text-xs text-zinc-300 leading-relaxed">
                  Passa alla console reale e crea un evento vero per testare il flusso completo.
                </div>
              </div>

              <button
                onClick={() => (window.location.href = "/dj/TEST123")}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 px-6 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_25px_rgba(251,191,36,0.25)] hover:brightness-110 transition"
              >
                CREA IL TUO EVENTO
              </button>

              <div className="mt-3 text-center text-xs text-zinc-500">
                Oppure usa la demo reale limitata dal sito
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}