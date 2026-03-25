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
            flexWrap: "wrap",
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
              <div style={{ fontSize: 12.8, opacity: 0.72, fontWeight: 700, maxWidth: 720 }}>
                un’app di supporto al DJ che permette di raccogliere richieste musicali e dediche tramite QR code durante matrimoni, feste ed eventi.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
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
              href="#tidal"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.80)",
                fontWeight: 900,
                fontSize: 12.8,
              }}
            >
              TIDAL
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
              href="#guida-console"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.80)",
                fontWeight: 900,
                fontSize: 12.8,
              }}
            >
              Guida console
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
                fontSize: 44,
                lineHeight: 1.08,
                fontWeight: 1000,
                letterSpacing: -0.4,
                maxWidth: 900,
              }}
            >
              Ricevi richieste musicali con un QR...{" "}
              <span style={{ color: "rgba(255,215,0,0.95)" }}>
                senza perdere il controllo
              </span>{" "}
              della serata...
            </h1>

            <div
              style={{
                fontSize: 15.8,
                opacity: 0.88,
                lineHeight: 1.72,
                maxWidth: 860,
                fontWeight: 650,
              }}
            >
              Gli ospiti inviano brani e dediche tramite QR. Tu da DJ li vedi in
              tempo reale in una console pulita, li selezioni, li organizzi e puoi
              creare una playlist TIDAL pronta per il tuo workflow.
            </div>

            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
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
              <Chip text="🎧 TIDAL ready" />
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 13.2,
                opacity: 0.76,
                fontWeight: 800,
                letterSpacing: 0.1,
              }}
            >
              Compatibile con TIDAL e integrabile nel workflow Rekordbox
            </div>
          </div>
        </section>

        {/* TIDAL WOW */}
        <section id="tidal" style={{ marginTop: 28 }}>
          <SectionTitle title="🎧 Auto Playlist TIDAL" />

          <div
            style={{
              borderRadius: 24,
              padding: 20,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 1000,
                lineHeight: 1.45,
                maxWidth: 860,
              }}
            >
              Le richieste degli ospiti non restano solo una lista: possono diventare
              una playlist evento pronta per il DJ.
            </div>

            <div
              style={{
                marginTop: 12,
                opacity: 0.88,
                lineHeight: 1.72,
                fontSize: 14.4,
                fontWeight: 650,
                maxWidth: 900,
              }}
            >
              Il DJ seleziona i brani migliori, AskDJ crea la playlist TIDAL
              dell’evento, evita i duplicati e mostra i BPM quando disponibili.
              Risultato: più ordine, meno passaggi inutili, più controllo.
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {[
                {
                  title: "⭐ Modalità DJ",
                  text: "Selezioni i brani che vuoi davvero tenere e portare nel tuo workflow.",
                },
                {
                  title: "🎧 Playlist evento",
                  text: "Con un click puoi creare o aggiornare la playlist TIDAL dedicata alla serata.",
                },
                {
                  title: "⚡ Workflow intelligente",
                  text: "Match libreria, niente duplicati e BPM già presenti quando disponibili.",
                },
                {
                  title: "🔵 Stato sincronizzazione",
                  text: "Capisci subito quali brani sono già passati nel flusso TIDAL.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div style={{ fontWeight: 1000, fontSize: 15.8 }}>{c.title}</div>
                  <div
                    style={{
                      marginTop: 8,
                      opacity: 0.86,
                      lineHeight: 1.68,
                      fontSize: 13.6,
                      fontWeight: 650,
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              ))}
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
              text: "Gli ospiti non ti bombardano mentre suoni: tutto entra in lista, ordinato e leggibile.",
              icon: "🧠",
            },
            {
              title: "Dediche incluse",
              text: "Una canzone + un messaggio. Perfetto per sposi, compleanni e momenti speciali.",
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

        {/* Why DJs use it */}
        <section style={{ marginTop: 34 }}>
          <SectionTitle title="Perché un DJ la usa davvero" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {[
              {
                title: "Più ordine",
                text: "Le richieste arrivano tutte in un solo posto, senza dover rincorrere persone o messaggi sparsi.",
                icon: "📋",
              },
              {
                title: "Più controllo",
                text: "Il DJ decide cosa tenere, cosa ignorare e cosa portare nella playlist dell’evento.",
                icon: "🎚️",
              },
              {
                title: "Meno stress",
                text: "Meno interruzioni, meno confusione durante la serata, più tempo per fare davvero il DJ.",
                icon: "🔥",
              },
            ].map((c) => (
              <div
                key={c.title}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(0,0,0,0.22)",
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
                    {c.icon}
                  </div>
                  <div style={{ fontWeight: 1000, fontSize: 16.2 }}>{c.title}</div>
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
                  {c.text}
                </div>
              </div>
            ))}
          </div>
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
                d: "Apri il pannello DJ e genera un evento per matrimonio, festa, locale o serata privata.",
              },
              {
                n: "2",
                t: "Stampa o condividi il QR",
                d: "Lo stampi oppure lo mostri su tablet, telefono o postazione dedicata all’ingresso.",
              },
              {
                n: "3",
                t: "Gli ospiti inviano brani + dedica",
                d: "Arriva tutto in lista: tu vedi, selezioni, ordini e tieni sempre in mano la situazione.",
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

        {/* Flow complete */}
        <section style={{ marginTop: 34 }}>
          <SectionTitle title="Dal QR alla playlist" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {[
              {
                n: "01",
                t: "QR code",
                d: "Gli ospiti entrano subito senza installare nulla.",
              },
              {
                n: "02",
                t: "Richieste live",
                d: "Brani, titoli e dediche arrivano in tempo reale nella console DJ.",
              },
              {
                n: "03",
                t: "Selezione DJ ⭐",
                d: "Tu scegli i brani migliori e tieni il controllo della scaletta.",
              },
              {
                n: "04",
                t: "Playlist TIDAL 🎧",
                d: "La lista selezionata può diventare una playlist evento pronta per il workflow del DJ.",
              },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.40)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 1000,
                    color: "rgba(255,215,0,0.95)",
                    letterSpacing: 1,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ marginTop: 8, fontWeight: 1000, fontSize: 16.2 }}>
                  {s.t}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    opacity: 0.86,
                    lineHeight: 1.72,
                    fontSize: 14,
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
                title: "Compleanni (anche bimbi, modalità PARTY)",
                text: "I piccoli scelgono le canzoni. Gli adulti non impazziscono, autoplay da YOUTUBE.",
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
                text: "Musica, dediche e atmosfera — tutto ordinato in una console semplice da gestire.",
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

        {/* PARTY mode focus */}
        <section style={{ marginTop: 34 }}>
          <SectionTitle title="🎉 Modalità PARTY" />

          <div
            style={{
              borderRadius: 24,
              padding: 20,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontSize: 16.4,
                fontWeight: 1000,
                lineHeight: 1.55,
                maxWidth: 850,
              }}
            >
              AskDJ non è solo console DJ: in modalità PARTY può gestire in autoplay
              i brani YouTube inviati durante la festa.
            </div>

            <div
              style={{
                marginTop: 12,
                opacity: 0.88,
                lineHeight: 1.72,
                fontSize: 14.2,
                fontWeight: 650,
                maxWidth: 900,
              }}
            >
              Perfetta per compleanni, feste private e situazioni in cui vuoi una
              gestione più leggera: gli ospiti inviano i brani e la modalità PARTY
              li riproduce in sequenza, mantenendo un’esperienza semplice e divertente.
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {[
                {
                  title: "▶️ Autoplay YouTube",
                  text: "Pensata per eventi dove vuoi far girare i brani in modo automatico.",
                },
                {
                  title: "🎈 Perfetta per feste",
                  text: "Compleanni, party privati e contesti più informali dove serve praticità.",
                },
                {
                  title: "📱 Esperienza immediata",
                  text: "Gli ospiti inviano, la lista si aggiorna e la festa continua senza impazzire.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div style={{ fontWeight: 1000, fontSize: 15.8 }}>{c.title}</div>
                  <div
                    style={{
                      marginTop: 8,
                      opacity: 0.86,
                      lineHeight: 1.68,
                      fontSize: 13.6,
                      fontWeight: 650,
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
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
              </div>
            ))}
          </div>
        </section>

        {/* Guide console */}
        <section id="guida-console" style={{ marginTop: 34 }}>
          <SectionTitle title="Come leggere la console" />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {[
              {
                title: "⭐ Stella",
                text: "Indica i brani selezionati dal DJ per il flusso principale.",
              },
              {
                title: "🔥 Voti",
                text: "Ti fanno capire a colpo d’occhio quali richieste stanno spingendo di più.",
              },
              {
                title: "🔴 / 🔵 Piattaforme",
                text: "I colori aiutano a distinguere velocemente la provenienza del brano o il suo stato.",
              },
              {
                title: "🎚️ BPM",
                text: "Quando disponibili, ti aiutano a valutare meglio il passaggio e il mix.",
              },
              {
                title: "🗑️ Azioni rapide",
                text: "Puoi eliminare, gestire o ignorare velocemente ciò che non ti serve.",
              },
              {
                title: "🔍 Match manuale",
                text: "Puoi cercare e collegare manualmente un brano quando non viene trovato automaticamente.",
              },
              {
                title: "🖨️ Stampa Playlist",
                text: "Puoi stampare la Playlist con i titoli dei brani della serata.",
              },
              {
                title: "🎧 Stato TIDAL",
                text: "Capisci quali brani sono già entrati nel workflow della playlist evento.",
              },
            ].map((g) => (
              <div
                key={g.title}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontWeight: 1000, fontSize: 16.2 }}>{g.title}</div>
                <div
                  style={{
                    marginTop: 10,
                    opacity: 0.86,
                    lineHeight: 1.72,
                    fontSize: 14,
                    fontWeight: 650,
                  }}
                >
                  {g.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage and rights */}
        <section style={{ marginTop: 34 }}>
          <SectionTitle title="Uso e diritti musicali" />

          <div
            style={{
              borderRadius: 24,
              padding: 20,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                opacity: 0.9,
                lineHeight: 1.78,
                fontSize: 14.2,
                fontWeight: 650,
                maxWidth: 920,
              }}
            >
              AskDJ non riproduce musica e non ospita contenuti audio.
              <br />
              <br />
              L’app serve esclusivamente per:
              <br />- raccogliere richieste musicali e dediche
              <br />- organizzare i brani in una lista ordinata
              <br />- facilitare il lavoro del DJ durante l’evento
              <br />
              <br />
              La riproduzione dei brani avviene sempre tramite piattaforme esterne
              come TIDAL, YouTube, Spotify, Apple Music o altre, utilizzate dal DJ
              con i propri account e secondo il proprio flusso di lavoro.
              <br />
              <br />
              Il DJ o chi utilizza il servizio è responsabile dell’uso delle
              piattaforme musicali e delle eventuali licenze necessarie per
              l’esecuzione pubblica.
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 34 }}>
          <SectionTitle title="FAQ" />

          <div style={{ display: "grid", gap: 14 }}>
            {[
              {
                q: "Gli ospiti devono installare l’app?",
                a: "No. Gli ospiti entrano da browser scansionando il QR. L’installazione è utile soprattutto al DJ, se vuole usare AskDJ come app installabile.",
              },
              {
                q: "Serve login o account?",
                a: "No per gli ospiti. Entrano con il QR dell’evento e inviano subito brani e dediche. Il DJ usa la console per gestire tutto in tempo reale.",
              },
              {
                q: "Cos’è la modalità Party?",
                a: "È la modalità festa: AskDJ può usare i brani YouTube inviati per una riproduzione automatica pensata per party, compleanni e contesti più leggeri.",
              },
              {
                q: "Si integra con Rekordbox / console DJ?",
                a: "AskDJ non si collega direttamente alla console. Quando il DJ utilizza TIDAL, AskDJ può creare e aggiornare una playlist dell’evento con i brani selezionati. Il DJ può poi utilizzare quella playlist nel proprio workflow su Rekordbox con il suo account TIDAL.",
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
          © {new Date().getFullYear()} AskDJ — info@askdj.app — Tutti i diritti riservati.
        </footer>

         <div style={{ marginTop: 6 }}>
  <a
    href="/privacy"
    style={{
      color: "rgba(244, 227, 41, 0.6)",
      textDecoration: "none",
      fontWeight: 600,
    }}
  >
    Privacy Policy
  </a>
</div>

      </div>
    </main>
  );
}