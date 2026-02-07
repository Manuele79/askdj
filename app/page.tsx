"use client";

import Link from "next/link";
import InstallButton from "./components/InstallButton";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(900px 400px at 20% 10%, rgba(109, 94, 252, 0.40), transparent 60%)," +
          "radial-gradient(700px 360px at 80% 20%, rgba(0, 209, 178, 0.28), transparent 55%)," +
          "radial-gradient(700px 360px at 60% 90%, rgba(255, 184, 0, 0.18), transparent 55%)," +
          "linear-gradient(180deg, #07070c 0%, #111124 100%)",
        color: "white",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 20,
          padding: 22,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* glow lines */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -2,
            background:
              "linear-gradient(90deg, rgba(109,94,252,0.35), rgba(0,209,178,0.25), rgba(255,184,0,0.18))",
            filter: "blur(22px)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(109,94,252,0.95), rgba(0,209,178,0.80))",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                boxShadow: "0 12px 22px rgba(0,0,0,0.30)",
              }}
              aria-hidden="true"
              title="AskDJ"
            >
              🎧
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 950,
                  letterSpacing: 0.2,
                  lineHeight: 1.1,
                }}
              >
                AskDJ
              </div>
              <div style={{ opacity: 0.86, fontSize: 13.5 }}>
                Richieste musicali al DJ via QR (senza sbatti).
              </div>
            </div>
          </div>

          {/* main text */}
          <div style={{ marginTop: 18, opacity: 0.95, lineHeight: 1.65 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontWeight: 900,
                letterSpacing: 0.4,
                fontSize: 12.5,
              }}
            >
              ✅ SOLO PER DJ
              <span style={{ opacity: 0.7, fontWeight: 700 }}>
                (gli ospiti entrano solo via QR)
              </span>
            </div>

            <div style={{ marginTop: 12, fontWeight: 900, fontSize: 16 }}>
              Come funziona (in 20 secondi):
            </div>

            <ol style={{ margin: 10, paddingLeft: 18 }}>
              <li style={{ marginBottom: 6 }}>
                Apri <strong>DJ / Party</strong> e crea un evento (es:{" "}
                <strong>MATRIMONIO-1513</strong>).
              </li>
              <li style={{ marginBottom: 6 }}>
                L’app genera un <strong>QR</strong> per quell’evento (stampalo o
                mostrala sul telefono).
              </li>
              <li style={{ marginBottom: 6 }}>
                Gli invitati <strong>scansionano il QR</strong> e finiscono
                direttamente su <strong>Event</strong> per inviare canzoni e
                dediche.
              </li>
            </ol>

            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 16,
                background: "rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 12.8,
                opacity: 0.95,
              }}
            >
              ⚠️ Gli ospiti <strong>NON</strong> devono entrare da qui.
              <br />
              Se uno apre questa pagina: sta facendo il DJ per sbaglio 😄
            </div>
          </div>

          {/* actions */}
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            <Link
              href="/dj/TEST123"
              style={{
                textDecoration: "none",
                display: "block",
                background: "linear-gradient(135deg, #6d5efc, #00d1b2)",
                color: "white",
                padding: "14px 16px",
                borderRadius: 16,
                fontWeight: 900,
                textAlign: "center",
                boxShadow: "0 14px 30px rgba(109,94,252,0.25)",
              }}
            >
              🎛️ Apri DJ / Party
            </Link>

            <InstallButton />

            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                opacity: 0.72,
                textAlign: "center",
              }}
            >
              (Questo è il pannello “da DJ” per creare eventi e generare il QR)
            </div>
          </div>

          {/* iphone help */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontWeight: 950, marginBottom: 6 }}>
              📱 Installazione su iPhone (Safari)
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.8, opacity: 0.9 }}>
              <li>Apri questo sito in Safari</li>
              <li>Tocca <strong>Condividi</strong> (quadrato con freccia ↑)</li>
              <li>Seleziona <strong>Aggiungi a Home</strong></li>
            </ol>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 11.5,
              opacity: 0.55,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} AskDJ — Manuele Martino
          </div>
        </div>
      </div>
    </main>
  );
}
