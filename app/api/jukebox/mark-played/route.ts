import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { error } = await supabase
    .from("requests")
    .update({
      jukebox_status: "played",
      jukebox_played_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("MARK PLAYED ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}