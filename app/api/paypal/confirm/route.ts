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

function getPaypalBaseUrl() {
  return "https://api-m.paypal.com";
}

async function getPaypalAccessToken() {
  const clientId = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_SECRET");

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal token error: ${txt}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = String(body.eventCode || "").trim().toUpperCase();

    if (!eventCode) {
      return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
    }

    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("event_code, payment_status, paypal_order_id")
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, error: "Evento non trovato" }, { status: 404 });
    }

    if (String(ev.payment_status || "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const orderId = String(ev.paypal_order_id || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Ordine PayPal mancante" },
        { status: 400 }
      );
    }

    const accessToken = await getPaypalAccessToken();

    const captureRes = await fetch(
      `${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureRes.json().catch(() => null);

    if (!captureRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: captureData?.message || "Errore capture PayPal",
          details: captureData,
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    const { error: upErr } = await supabase
      .from("events")
      .update({
        payment_status: "paid",
        paid_at: now,
      })
      .eq("event_code", eventCode);

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: "Errore aggiornamento evento" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      captured: true,
      paypal: captureData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}