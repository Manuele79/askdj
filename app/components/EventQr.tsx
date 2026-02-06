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
    <div
      
      className="
        rounded-3xl border border-yellow-400/80 bg-pink-400/20 backdrop-blur p-4
        shadow-[0_0_20px_rgba(250,204,21,0.18)]
      "
    >
      <div className="mb-3">
        <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300">
          QR Invito Ospiti
        </div>
        <div className="text-xs text-cyan-400">
          Scansiona e manda richieste
        </div>
      </div>
      
      <div className="mb-4 text-center">
  <div className="text-xl font-extrabold text-black">
    Evento
  </div>
  <div className="text-2xl font-black tracking-wide text-black">
    {eventCode}
  </div>
</div>


      <div
        id="print-qr"
        className="rounded-2xl border border-cyan-400/50 bg-white p-3 inline-block">
        <QRCodeCanvas value={url} size={200} />
      </div>

      {eventCode !== "TEST123" && (
      <div className="mt-3 rounded-2xl border border-yellow-400/25 bg-zinc-900/40 p-3">
       <p className="font-mono text-xs text-zinc-200 break-all">
       {url}
      </p>
      </div>
      )}


        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="
              rounded-xl px-4 py-2 text-xs font-extrabold text-zinc-950
              bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300
              shadow-[0_10px_25px_rgba(0,0,0,0.25)]
            "
          >
            {copied ? "COPIATO!" : "Copia link"}
          </button>

          <button
            onClick={() => window.print()}
            className="
              rounded-xl px-4 py-2 text-xs font-extrabold text-zinc-100
              border border-yellow-400/45 bg-zinc-900/50
              hover:bg-zinc-900/70 transition
              shadow-[0_10px_25px_rgba(0,0,0,0.25)]
            "
          >
            Stampa QR
          </button>
        </div>
      </div>
    
  );
}
