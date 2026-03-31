import { NextResponse } from "next/server";

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

  // Risposta test
  return NextResponse.json({
    ok: true,
    message: "Admin monitor endpoint attivo 🚀"
  });
}