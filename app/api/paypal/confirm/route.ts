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

function addDuration(base: Date, mode: string, duration: string | null) {
  const d = new Date(base);

  if (mode === "dj_party") {
    d.setHours(d.getHours() + 12);
    return d;
  }

  if (mode === "jukebox") {
    if (duration === "1m") {
      d.setMonth(d.getMonth() + 1);
      return d;
    }

    if (duration === "1y") {
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }

    d.setDate(d.getDate() + 1);
    return d;
  }

  throw new Error("Modalità evento non valida");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = String(body.eventCode || "").trim().toUpperCase();
    const orderType = String(body.type || "create").trim().toLowerCase();
    const isRenew = orderType === "renew";

    const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "payments_enabled")
    .single();

  const paymentsEnabled = settings?.value === "true";

    if (!eventCode) {
      return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
    }

    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("event_code, mode, duration, expires_at, payment_status, paypal_order_id")
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, error: "Evento non trovato" }, { status: 404 });
    }

    if (!isRenew && String(ev.payment_status || "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const orderId = String(ev.paypal_order_id || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Ordine PayPal mancante" },
        { status: 400 }
      );
    }

let captureData: any = null;

if (paymentsEnabled) {
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

  captureData = await captureRes.json().catch(() => null);

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
}

    const now = new Date();

    const updatePayload: any = {
      payment_status: "paid",
      paid_at: now.toISOString(),
    };

    if (isRenew) {
      const currentExpires = ev.expires_at ? new Date(ev.expires_at) : null;

      const base =
        currentExpires && currentExpires.getTime() > now.getTime()
          ? currentExpires
          : now;

      updatePayload.expires_at = addDuration(
        base,
        ev.mode,
        ev.mode === "jukebox" ? ev.duration || "1d" : null
      ).toISOString();
    }

    const { error: upErr } = await supabase
      .from("events")
      .update(updatePayload)
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
      renewed: isRenew,
      expiresAt: updatePayload.expires_at || ev.expires_at,
      paypal: captureData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}