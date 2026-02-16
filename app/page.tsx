"use client";

import Link from "next/link";
import InstallButton from "./components/InstallButton";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 18px",
        background:
          // “foto” finta (glow + texture)
          "radial-gradient(900px 520px at 15% 15%, rgba(255, 215, 0, 0.18), transparent 60%)," +
          "radial-gradient(800px 520px at 85% 20%, rgba(0, 255, 200, 0.10), transparent 58%)," +
          "radial-gradient(900px 520px at 60% 95%, rgba(255, 70, 120, 0.08), transparent 60%)," +
          "linear-gradient(180deg, #07070b 0%, #0b0b14 55%, #090913 100%)",
        color: "white",
        fontFamily:
          "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(255,215,0,0.92), rgba(255,255,255,0.06))",
                border: "1px solid rgba(255,215,0,0.30)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
              }}
              title="AskDJ"
            >
              🎧
            </div>

            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>
                AskDJ
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.72 }}>
                QR per richieste musicali & dediche — stile pro, zero caos.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href="#come-funziona"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 800,
                fontSize: 12.5,
              }}
            >
              Come funziona
            </a>
            <a
              href="#casi"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 800,
                fontSize: 12.5,
              }}
            >
              Eventi
            </a>
            <a
              href="#faq"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 800,
                fontSize: 12.5,
              }}
            >
              FAQ
            </a>
          </div>
        </div>

        {/* Hero */}
        <section
          style={{
            borderRadius: 26,
            padding: 22,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.60)",
            backdropFilter: "blur(10px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* subtle “photo” layer */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -2,
              background:
                "linear-gradient(90deg, rgba(255,215,0,0.24), rgba(255,255,255,0.02), rgba(0,255,200,0.12))",
              filter: "blur(22px)",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                gap: 10,
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(255,215,0,0.22)",
                fontWeight: 900,
                letterSpacing: 0.3,
                fontSize: 12.5,
              }}
            >
              ✨ Wedding • DJ • Party
              <span style={{ opacity: 0.75, fontWeight: 800 }}>
                (gli ospiti entrano solo via QR)
              </span>
            </div>

            <h1
              style={{
                margin: "14px 0 8px",
                fontSize: 36,
                lineHeight: 1.08,
                fontWeight: 1000,
                letterSpacing: -0.2,
              }}
            >
              Il modo elegante per raccogliere
              <span style={{ color: "rgba(255,215,0,0.95)" }}> richieste & dediche </span>
              al DJ.
            </h1>

            <div style={{ fontSize: 15.5, opacity: 0.86, lineHeight: 1.65, maxWidth: 760 }}>
              Con un QR gli ospiti inviano brani (YouTube / Spotify / Apple / Amazon / TIDAL)
              e una dedica. Tu da DJ hai una lista pulita, aggregata e pronta.
              Niente “url sparsi” in chat. Niente caos.
            </div>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {/* Nota: per ora lascio /dj/TEST123 per non rompere. Quando crei /dj/page.tsx lo cambi a /dj */}
              <Link
                href="/dj/TEST123"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,255,255,0.10))",
                  color: "#0b0b14",
                  padding: "14px 16px",
                  borderRadius: 16,
                  fontWeight: 950,
                  boxShadow: "0 18px 38px rgba(255,215,0,0.14)",
                  border: "1px solid rgba(255,215,0,0.32)",
                  minWidth: 210,
                }}
              >
                🎛️ Apri pannello DJ
              </Link>

              <InstallButton />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(0,0,0,0.24)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.80)",
                  fontSize: 12.5,
                  fontWeight: 800,
                }}
              >
                ✅ PWA installabile • ✅ QR stampa • ✅ titoli ok
              </div>
            </div>
          </div>
        </section>

        {/* Benefit cards */}
        <section style={{ marginTop: 18, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {[
            {
              title: "Zero caos",
              text: "Gli ospiti non ti bombardano WhatsApp: tutto entra in lista, ordinato e leggibile.",
              icon: "🧠",
            },
            {
              title: "Dediche incluse",
              text: "Una canzone + un messaggio. Perfetto per sposi, compleanni, momenti speciali.",
              icon: "💛",
            },
            {
              title: "Multi-piattaforma",
              text: "Link o titolo da YouTube, Spotify, Apple Music, Amazon Music e TIDAL.",
              icon: "🌍",
            },
          ].map((c) => (
            <div
              key={c.title}
              style={{
                borderRadius: 22,
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,215,0,0.10)",
                    border: "1px solid rgba(255,215,0,0.20)",
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ fontWeight: 1000, fontSize: 15.5 }}>{c.title}</div>
              </div>
              <div style={{ marginTop: 10, opacity: 0.82, lineHeight: 1.6, fontSize: 13.5 }}>
                {c.text}
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="come-funziona" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 10 }}>
            Come funziona
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {[
              { n: "1", t: "Crea un evento", d: "Apri il pannello DJ e genera un evento (matrimonio, festa, locale…)." },
              { n: "2", t: "Stampa o mostra il QR", d: "Lo stampi oppure lo metti su un tablet/telefono all’ingresso." },
              { n: "3", t: "Gli ospiti inviano brani + dedica", d: "Arriva tutto in lista: tu scegli, ordini, fai partire." },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontSize: 26, fontWeight: 1000, color: "rgba(255,215,0,0.95)" }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 1000 }}>{s.t}</div>
                </div>
                <div style={{ marginTop: 8, opacity: 0.82, lineHeight: 1.6, fontSize: 13.5 }}>
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section id="casi" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 10 }}>
            Dove la usi (idee che vendono)
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {[
              {
                title: "Matrimoni",
                text: "Dediche agli sposi, momenti speciali, richieste “eleganti” senza caos.",
                icon: "💍",
              },
              {
                title: "Compleanni (anche bimbi)",
                text: "I piccoli scelgono le canzoni. Gli adulti non impazziscono.",
                icon: "🎂",
              },
              {
                title: "DJ set & locali",
                text: "Raccogli richieste, fai votare e tieni la pista viva senza perdere controllo.",
                icon: "🎧",
              },
              {
                title: "Karaoke / YouTube video",
                text: "Invio rapido dei video e gestione lista senza fogli o chat infinite.",
                icon: "🎤",
              },
              {
                title: "Eventi aziendali",
                text: "Musica “safe”, dediche, atmosfera — tutto ordinato.",
                icon: "🏢",
              },
              {
                title: "Dedica a distanza",
                text: "Condividi un link: qualcuno dall’altra parte del mondo invia una canzone con messaggio.",
                icon: "🌍",
              },
            ].map((u) => (
              <div
                key={u.title}
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,215,0,0.10)",
                      border: "1px solid rgba(255,215,0,0.18)",
                    }}
                  >
                    {u.icon}
                  </div>
                  <div style={{ fontWeight: 1000, fontSize: 15.5 }}>{u.title}</div>
                </div>
                <div style={{ marginTop: 10, opacity: 0.82, lineHeight: 1.6, fontSize: 13.5 }}>
                  {u.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* “Screenshots” placeholders */}
        <section style={{ marginTop: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 10 }}>
            Un assaggio dell’app
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: 26,
                  padding: 14,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    height: 220,
                    borderRadius: 18,
                    background:
                      "radial-gradient(700px 260px at 20% 10%, rgba(255,215,0,0.16), transparent 60%)," +
                      "radial-gradient(700px 260px at 80% 30%, rgba(0,255,200,0.10), transparent 58%)," +
                      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                />
                <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.75 }}>
                  Screenshot {i} (qui puoi mettere una foto vera quando vuoi).
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
            Se vuoi: metti 2 immagini in <strong>/public</strong> (es: <strong>screen-dj.png</strong> e <strong>screen-event.png</strong>)
            e le sostituiamo ai placeholder.
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 10 }}>
            FAQ
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                q: "Gli ospiti devono installare l’app?",
                a: "No. Gli ospiti entrano da browser scansionando il QR. L’installazione è utile soprattutto al DJ.",
              },
              {
                q: "Serve login o account?",
                a: "Nella versione attuale no. Nella fase successiva possiamo aggiungere accesso premium e gestione eventi.",
              },
              {
                q: "Si integra con Rekordbox / console DJ?",
                a: "Non direttamente: AskDJ serve per raccogliere richieste e dediche. In futuro: export playlist CSV.",
              },
            ].map((f) => (
              <div
                key={f.q}
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontWeight: 1000 }}>{f.q}</div>
                <div style={{ marginTop: 6, opacity: 0.82, lineHeight: 1.6, fontSize: 13.5 }}>
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: 22,
            padding: "18px 4px",
            opacity: 0.55,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} AskDJ — Manuele Martino
        </footer>
      </div>
    </main>
  );
}
