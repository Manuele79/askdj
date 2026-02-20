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
  rounded-xl px-5 py-3 text-sm font-extrabold
  bg-zinc-900/60
  border border-yellow-400/40
  text-yellow-300
  hover:bg-zinc-900/80
  transition
"
    >
      Prova Demo (20 min)
    </button>
  );
}