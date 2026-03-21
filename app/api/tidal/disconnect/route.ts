import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeEventCode(code: any) {
  return String(code || "").trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = normalizeEventCode(body.eventCode);

    if (!eventCode) {
      return NextResponse.json(
        { ok: false, error: "Missing eventCode" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("events")
      .update({
        tidal_connected: false,
        tidal_user_id: null,
      })
      .eq("event_code", eventCode);

    if (error) {
      console.error("TIDAL DISCONNECT ERROR:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to disconnect TIDAL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("TIDAL DISCONNECT UNEXPECTED ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}