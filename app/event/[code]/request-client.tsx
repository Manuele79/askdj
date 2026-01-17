"use client";

import { useMemo, useState } from "react";

export default function RequestClient({ code }: { code: string }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => {
    return title.trim().length > 0 || link.trim().length > 0;
  }, [title, link]);

  function looksLikeYouTube(u: string) {
    return u.includes("youtube.com") || u.includes("youtu.be");
  }

  async function addRequest() {
    const t = title.trim();
    const url = link.trim();
    if (!t && !url) return;

    setLoading(true);
    try {
      let finalTitle = t || "Richiesta";

      if (url && looksLikeYouTube(url)) {
        try {
          const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.title) finalTitle = data.title;
          }
        } catch {}
      }

      await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventCode: code,
          title: finalTitle,
          url: url,
        }),
      });

      setSent((prev) => [finalTitle, ...prev]);
      setTitle("");
      setLink("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* HEADER */}
        <header className="mb-8 text-center">

          {/* LOGO */}
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-20 w-20">
              <defs>
                <linearGradient id="mvGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
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

              {/* M */}
              <text
                x="32"
                y="42"
                textAnchor="middle"
                fontSize="26"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                fill="#34d399"
              >
                M
              </text>

              {/* V sovrapposta */}
              <text
                x="34"
                y="46"
                textAnchor="middle"
                fontSize="26"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                fill="#fb7185"
              >
                V
              </text>
            </svg>
          </div>

          {/* DJ REQUESTS */}
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-pink-400">
            DJ Requests
          </h2>

          {/* TITOLO */}
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Invia una canzone
          </h1>

          {/* EVENTO */}
          <p className="mt-2 text-sm text-zinc-300">
            Evento:
            <span className="ml-2 rounded-md bg-zinc-800 px-2 py-1 font-mono text-zinc-100">
              {code}
            </span>
          </p>
        </header>

        {/* FORM */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-300">
                Titolo (o incolli un link sotto)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Freed from Desire"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">
                Link (YouTube / Spotify / Apple / Amazon…)
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Incolla qui il link condiviso"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Party autoplay funziona solo con link YouTube. Gli altri link si aprono dal DJ.
              </p>
            </div>

            <button
              onClick={addRequest}
              disabled={!canSend || loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-pink-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Invio..." : "Invia al DJ"}
            </button>
          </div>
        </section>

        {/* LISTA */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">
              Richieste inviate
            </h2>
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
              {sent.length}
            </span>
          </div>

          {sent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">
              Nessuna richiesta ancora.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sent.slice(0, 10).map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200"
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          Nessun audio viene inviato. Solo link e titolo.
        </footer>
      </div>
    </div>
  );
}
