"use client";

export default function DemoButton() {
  const startDemo = async () => {
    try {
      const r = await fetch("/api/demo", { method: "POST" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Errore demo");

      window.location.href = `/dj/${j.eventCode}`;
    } catch (e: any) {
      alert(e?.message || "Errore demo");
    }
  };

  return (
    <button
      onClick={startDemo}
      className="
        rounded-xl px-5 py-3 text-sm font-extrabold text-zinc-950
        bg-gradient-to-r from-emerald-300 via-cyan-300 to-pink-300
        shadow-[0_10px_25px_rgba(0,0,0,0.25)]
      "
    >
      Prova Demo (20 min)
    </button>
  );
}