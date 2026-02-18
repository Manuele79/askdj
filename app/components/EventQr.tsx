"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";


export default function EventQr({ eventCode }: { eventCode: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [printPng, setPrintPng] = useState<string>("");


  useEffect(() => {
    setUrl(`${window.location.origin}/event/${encodeURIComponent(eventCode)}`);
  }, [eventCode]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function printQr() {
  const holder = document.getElementById("qr-canvas");
  const canvas = holder?.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    alert("QR non pronto, riprova tra 1 secondo.");
    return;
  }

  const png = canvas.toDataURL("image/png");
  const safeEvent = (eventCode && eventCode !== "TEST123") ? eventCode : "";
  const safeUrl = url || "";

  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) {
    alert("Popup bloccato dal browser. Consenti i popup per stampare.");
    return;
  }

  w.document.open();
  w.document.write(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AskDJ QR</title>
  <style>
    @page { margin: 0; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
    .wrap {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
    .card {
      text-align: center;
      padding: 24px;
    }
    .h1 { font-size: 18px; font-weight: 800; margin: 0 0 6px; }
    .h2 { font-size: 22px; font-weight: 900; margin: 0 0 18px; }
    img { width: 360px; height: 360px; image-rendering: pixelated; }
    .url { margin-top: 14px; font-size: 12px; word-break: break-all; color: #111; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="h1">Nome Evento:</div>
      <div class="h2">${safeEvent}</div>
      <img src="${png}" alt="QR" />
      <div class="url">${safeUrl}</div>
    </div>
  </div>

  <script>
    window.onload = () => {
      window.focus();
      window.print();
      setTimeout(() => window.close(), 200);
    };
  </script>
</body>
</html>
  `);
  w.document.close();
}



  return (
    <>
    <div
      id="print-qr"
      className="
        rounded-3xl border border-yellow-400/80 bg-zinc-400/20 backdrop-blur p-4
        shadow-[0_0_20px_rgba(250,204,21,0.18)]
      "
      >
      <div className="mb-3">
        <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300">
          QR per Invitare gli Ospiti
        </div>
        <div className="text-xs text-cyan-400">
          Scansionano e mandano le richieste al DJ:
        </div>
      </div>
      
      <div className="mb-4 text-center">
        <div className="text-xl font-extrabold text-cyan-400">
          Nome Evento:
         </div>
         <div className="text-2xl font-black tracking-wide text-cyan-500">
         {eventCode !== "TEST123" ? eventCode : ""}

         </div>
      </div>


      <div className="rounded-2xl border border-cyan-400/50 bg-white p-3 print:border-0 print:bg-transparent print:p-0">
  <div className="print-only">
  {printPng ? (
    <img src={printPng} alt="QR" style={{ width: 360, height: 360 }} />
  ) : (
    <div style={{ width: 360, height: 360 }} />
  )}
</div>



<div className="no-print">
  <div id="qr-canvas">
    <QRCodeCanvas value={url} size={200} />
  </div>
</div>


</div>

{eventCode !== "TEST123" && (
  <div className="mt-3 w-full flex justify-center">
    <span className="
      block
      w-fit
      max-w-[260px]
      text-center
      font-mono
      text-xs
      text-cyan-200
      break-all
      rounded-lg
      bg-zinc-900/60
      px-3 py-2
    ">
      {url}
    </span>
  </div>
)}



     </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="
              rounded-xl px-5 py-6 text-xs font-extrabold text-zinc-950
              bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300
              shadow-[0_10px_25px_rgba(0,0,0,0.25)]
            "
          >
            {copied ? "COPIATO!" : "Copia link"}
          </button>

          <button
            onClick={printQr}

            className="
              rounded-xl px-5 py-6 text-xs font-extrabold text-zinc-100
              border border-yellow-400/45 bg-zinc-900/50
              hover:bg-zinc-900/70 transition
              shadow-[0_10px_25px_rgba(0,0,0,0.25)]
            "
          >
            Stampa QR
          </button>
        </div>
       </>
    
  );      
}
