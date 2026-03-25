export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#0b0b14",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", lineHeight: 1.7 }}>
        <h1 style={{ fontSize: 28, fontWeight: 1000, marginBottom: 20 }}>
          Privacy Policy — AskDJ
        </h1>

        <p><b>Ultimo aggiornamento: 2026</b></p>

        <p>
          AskDJ è una web app che permette di raccogliere richieste musicali e
          dediche durante eventi tramite QR code.
        </p>

        <h2>DATI RACCOLTI</h2>
        <p>
          Durante l’utilizzo dell’app possono essere raccolti:
        </p>
        <ul>
          <li>Titolo del brano inserito</li>
          <li>Link della canzone (YouTube, Spotify, TIDAL, ecc.)</li>
          <li>Dediche inserite dagli utenti</li>
          <li>Dati tecnici minimi per il funzionamento</li>
        </ul>

        <p>
          AskDJ non richiede registrazione per gli ospiti e non raccoglie dati sensibili.
        </p>

        <h2>FINALITÀ</h2>
        <p>
          I dati vengono utilizzati esclusivamente per:
        </p>
        <ul>
          <li>inviare richieste musicali</li>
          <li>mostrarle nella console DJ</li>
          <li>organizzare i contenuti durante l’evento</li>
        </ul>

        <h2>PIATTAFORME ESTERNE</h2>
        <p>
          AskDJ può interagire con servizi esterni come TIDAL, YouTube e Spotify.
          La riproduzione avviene sempre su queste piattaforme.
        </p>

        <h2>RESPONSABILITÀ</h2>
        <p>
          Il DJ o l’organizzatore è responsabile dell’uso corretto delle piattaforme musicali
          e delle eventuali licenze.
        </p>

        <h2>CONTATTI</h2>
        <p>info@askdj.app</p>

        <p style={{ marginTop: 40, opacity: 0.6 }}>
          © 2026 AskDJ — Tutti i diritti riservati
        </p>
      </div>
    </main>
  );
}