import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

export async function GET() {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["payments_enabled", "require_create_password"]);

  if (error) {
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }

  const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]));

  return NextResponse.json({
    ok: true,
    payments_enabled: String(map.payments_enabled || "").toLowerCase() === "true",
    require_create_password: String(map.require_create_password || "").toLowerCase() === "true",
  });
}