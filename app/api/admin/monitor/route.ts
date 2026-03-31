import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY")
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  // Controllo token
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 🔥 DATA DI OGGI
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🔥 QUERY
  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: {
      created_today: count || 0
    }
  });
}