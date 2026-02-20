"use client";

import Link from "next/link";
import InstallButton from "./components/InstallButton";
import DemoButton from "./components/DemoButton";


function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 1000,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </div>
      <div
        aria-hidden="true"
        style={{
          height: 6,
          width: 160,
          borderRadius: 999,
          marginTop: 8,
          background:
            "linear-gradient(90deg, rgba(255,215,0,0.95), rgba(255,215,0,0.12))",
          opacity: 0.92,
        }}
      />
    </div>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(0,0,0,0.24)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.84)",
        fontSize: 12.5,
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px 18px",
        background:
          "radial-gradient(900px 520px at 15% 15%, rgba(255, 215, 0, 0.16), transparent 60%)," +
          "radial-gradient(800px 520px at 85% 20%, rgba(0, 255, 200, 0.10), transparent 58%)," +
          "radial-gradient(900px 520px at 60% 95%, rgba(255, 70, 120, 0.08), transparent 60%)," +
          "linear-gradient(180deg, #07070b 0%, #0b0b14 55%, #090913 100%)",
        color: "white",
        fontFamily:
          "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 50,
                height: 50,
                borderRadius: 16,
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

            <div style={{ lineHeight: 1.12 }}>
              <div style={{ fontSize: 45, fontWeight: 1000, letterSpacing: 0.2 }}>
                <span style={{ color: "rgba(255,215,0,0.95)" }}>Ask</span>DJ
              </div>
              <div style={{ fontSize: 12.8, opacity: 0.72, fontWeight: 700 }}>
                QR per richieste musicali & dediche — stile pro, zero caos.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href="#come-funziona"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.80)",
                fontWeight: 900,
                fontSize: 12.8,
              }}
            >
              Come funziona
            </a>
            <a
              href="#casi"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.80)",
                fontWeight: 900,
                fontSize: 12.8,
              }}
            >
              Eventi
            </a>
            <a
              href="#faq"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.80)",
                fontWeight: 900,
                fontSize: 12.8,
              }}
            >
              FAQ
            </a>
          </div>
        </div>

        {/* Hero */}
        <section
          style={{
            borderRadius: 28,
            padding: 24,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.60)",
            backdropFilter: "blur(10px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
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
                fontWeight: 1000,
                letterSpacing: 0.3,
                fontSize: 12.8,
              }}
            >
              ✨ Wedding • DJ • Party
            </div>

            <h1
              style={{
                margin: "16px 0 10px",
                fontSize: 38,
                lineHeight: 1.08,
                fontWeight: 1000,
                letterSpacing: -0.4,
              }}
            >
              Il modo elegante per raccogliere{" "}
              <span style={{ color: "rgba(255,215,0,0.95)" }}>
                richieste & dediche
              </span>{" "}
              al DJ.
            </h1>

            <div
              style={{
                fontSize: 15.8,
                opacity: 0.88,
                lineHeight: 1.72,
                maxWidth: 820,
                fontWeight: 650,
              }}
            >
              Con un QR gli ospiti inviano brani (YouTube / Spotify / Apple /
              Amazon / TIDAL) e una dedica. Tu da DJ hai una lista pulita,
              aggregata e pronta. Niente link sparsi in chat. Niente caos.
            </div>

            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {/* Nota: per ora lascio /dj/TEST123 per non rompere.
                  Quando crei /dj/page.tsx lo cambi a /dj */}
              <Link
                href="/dj/TEST123"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background:
                    "linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,255,255,0.10))",
                  color: "#0b0b14",
                  padding: "14px 16px",
                  borderRadius: 16,
                  fontWeight: 1000,
                  boxShadow: "0 18px 38px rgba(255,215,0,0.14)",
                  border: "1px solid rgba(255,215,0,0.32)",
                  minWidth: 215,
                }}
              >
                🎛️ Apri pannello DJ
              </Link>

              <DemoButton />

              <InstallButton />

              <Chip text="✅ PWA installabile" />
              <Chip text="✅ QR stampa" />
              <Chip text="✅ Titoli OK" />
            </div>
          </div>
        </section>

        {/* Benefit cards */}
        <section
          style={{
            marginTop: 28,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
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
                borderRadius: 24,
                padding: 18,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,215,0,0.10)",
                    border: "1px solid rgba(255,215,0,0.20)",
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ fontWeight: 1000, fontSize: 16.2 }}>{c.title}</div>
              </div>
              <div
                style={{
                  marginTop: 12,
                  opacity: 0.86,
                  lineHeight: 1.7,
                  fontSize: 14,
                  fontWeight: 650,
                }}
              >
                {c.text}
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="come-funziona" style={{ marginTop: 34 }}>
          <SectionTitle title="Come funziona:" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {[
              {
                n: "1",
                t: "Crea un evento",
                d: "Apri il pannello DJ e genera un evento (matrimonio, festa, locale…).",
              },
              {
                n: "2",
                t: "Stampa o condividi il QR",
                d: "Lo stampi oppure lo metti su un tablet/telefono all’ingresso.",
              },
              {
                n: "3",
                t: "Gli ospiti inviano brani + dedica",
                d: "Arriva tutto in lista: tu scegli, ordini, fai partire.",
              },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 1000,
                      color: "rgba(255,215,0,0.95)",
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 16.6,
                      fontWeight: 1000,
                      letterSpacing: -0.15,
                    }}
                  >
                    {s.t}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    opacity: 0.88,
                    lineHeight: 1.75,
                    fontSize: 14.2,
                    fontWeight: 650,
                  }}
                >
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section id="casi" style={{ marginTop: 34 }}>
          <SectionTitle title="Dove la usi:" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {[
              {
                title: "Matrimoni",
                text: "Dediche agli sposi, momenti speciali, richieste eleganti senza caos.",
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
                text: "Musica safe, dediche, atmosfera — tutto ordinato.",
                icon: "🏢",
              },
              {
                title: "Dedica a distanza",
                text: "Condividi un link con qualcuno dall’altra parte del mondo inviando una canzone con una dedica.",
                icon: "🌍",
              },
            ].map((u) => (
              <div
                key={u.title}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,215,0,0.10)",
                      border: "1px solid rgba(255,215,0,0.18)",
                    }}
                  >
                    {u.icon}
                  </div>
                  <div style={{ fontWeight: 1000, fontSize: 16.2 }}>{u.title}</div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    opacity: 0.86,
                    lineHeight: 1.72,
                    fontSize: 14,
                    fontWeight: 650,
                  }}
                >
                  {u.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Screenshots */}
        <section style={{ marginTop: 34 }}>
          <SectionTitle title="Un assaggio dell’app" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            {[
              { src: "/screen-dj.png", label: "Pannello DJ / Party" },
              { src: "/screen-event.png", label: "Schermata Ospiti (Event)" },
            ].map((img) => (
              <div
                key={img.src}
                style={{
                  borderRadius: 26,
                  padding: 14,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  style={{
                    width: "100%",
                    height: 280,
                    objectFit: "cover",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                />
                <div style={{ marginTop: 10, fontSize: 12.8, opacity: 0.8 }}>
                  {img.label}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.62 }}>
                  
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 34 }}>
          <SectionTitle title="FAQ" />

          <div style={{ display: "grid", gap: 14 }}>
            {[
              {
                q: "Gli ospiti devono installare l’app?",
                a: "No. Gli ospiti entrano da browser scansionando il QR. L’installazione è utile soprattutto al DJ.",
              },
              {
                q: "Serve login o account?",
                a: "NO! La condivisione dei link avviene in tempo reale, entrando nell l’app scanerizzando il QR dell’evento ",
              },
              {
                q: "Cos’è la modalità Party?",
                a: "È la modalità festa: autoplay su YouTube, dei link inviati e accesso rapido alle altre piattaforme. Tu gestisci la serata senza impazzire.",
              },
              {
                q: "Si integra con Rekordbox / console DJ?",
                a: "Non direttamente: AskDJ serve per raccogliere richieste e dediche. In futuro: export playlist CSV per portarti la lista dove vuoi.",
              },
            ].map((f) => (
              <div
                key={f.q}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div style={{ fontWeight: 1000, fontSize: 15.5 }}>{f.q}</div>
                <div
                  style={{
                    marginTop: 8,
                    opacity: 0.86,
                    lineHeight: 1.72,
                    fontSize: 14,
                    fontWeight: 650,
                  }}
                >
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </section>

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
          © {new Date().getFullYear()} AskDJ — Manuele Martino
        </footer>
      </div>
    </main>
  );
}
