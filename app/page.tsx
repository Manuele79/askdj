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
          "radial-gradient(900px 400px at 20% 10%, rgba(109, 94, 252, 0.35), transparent 60%)," +
          "radial-gradient(700px 360px at 80% 20%, rgba(0, 209, 178, 0.22), transparent 55%)," +
          "linear-gradient(180deg, #0b0b0f 0%, #141423 100%)",
        color: "white",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 18,
          padding: 22,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(109,94,252,0.9), rgba(0,209,178,0.75))",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
            }}
            aria-hidden="true"
          >
            🎧
          </div>

          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.2 }}>
              AskDJ
            </div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Richieste musicali via QR — senza sbatti.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, opacity: 0.92, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 10, fontWeight: 800 }}>
            Come funziona (terra terra):
          </div>

          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              Il DJ apre <strong>DJ / Party</strong> e crea l’evento.
            </li>
            <li>
              L’app genera un <strong>QR</strong> per quell’evento.
            </li>
            <li>
              Gli invitati scansionano il QR e finiscono{" "}
              <strong>diretti</strong> sulla pagina evento per inviare richieste.
            </li>
          </ol>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12.5,
              opacity: 0.9,
            }}
          >
            Nota: l’ospite <strong>non entra da qui</strong>. Entra solo col QR
            dell’evento.
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Link
            href="/dj"
            style={{
              textDecoration: "none",
              display: "block",
              background: "linear-gradient(135deg, #6d5efc, #00d1b2)",
              color: "white",
              padding: "14px 16px",
              borderRadius: 14,
              fontWeight: 800,
              textAlign: "center",
              boxShadow: "0 12px 26px rgba(109,94,252,0.25)",
            }}
          >
            Apri DJ / Party
          </Link>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              opacity: 0.72,
              textAlign: "center",
            }}
          >
            (Sì, questo è il pannello “da DJ”. Gli ospiti non lo vedono.)
          </div>
        </div>
      </div>
    </main>
  );
}
