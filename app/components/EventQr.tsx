"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";


export default function EventQr({ eventCode }: { eventCode: string }) {
  const [copied, setCopied] = useState(false);

  const [url, setUrl] = useState("");

useEffect(() => {
  setUrl(`${window.location.origin}/event/${encodeURIComponent(eventCode)}`);
}, [eventCode]);


  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div style={{ padding: 20, border: "1px solid #333", borderRadius: 12 }}>
      <h3>QR Invito Ospiti</h3>

      <div style={{ background: "white", display: "inline-block", padding: 10 }}>
        <QRCodeCanvas value={url} size={180} />
      </div>

      <p style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
        {url}
      </p>

      <button onClick={copy}>
        {copied ? "COPIATO!" : "Copia link"}
      </button>

      <button onClick={() => window.print()} style={{ marginLeft: 10 }}>
        Stampa QR
      </button>
    </div>
  );
}
