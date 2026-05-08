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

function getPrice(mode: string, duration: string | null) {
  if (mode === "dj_party") return "10.00";

  if (mode === "jukebox") {
    if (duration === "1m") return "8.99";
    if (duration === "1y") return "69.00";
    return "1.00";
  }

  throw new Error("Prezzo non configurato");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const eventCode = String(body.eventCode || "").trim().toUpperCase();

    const orderType = String(body.type || "create").trim().toLowerCase();
    const isRenew = orderType === "renew";

    if (!eventCode) {
      return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 });
    }

    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("event_code, mode, duration, payment_status, paypal_order_id")
      .eq("event_code", eventCode)
      .single();

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, error: "Evento non trovato" }, { status: 404 });
    }

    if (!isRenew && String(ev.payment_status || "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: false, error: "Evento già pagato" }, { status: 409 });
    }

    const amount = getPrice(ev.mode, ev.duration || null);
    const accessToken = await getPaypalAccessToken();

    const baseAppUrl = "https://www.askdj.app";
    const modePath = ev.mode === "jukebox" ? "jukebox" : "dj";

    const paypalRes = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: ev.event_code,
            description: isRenew
            ? `AskDJ RINNOVO ${ev.mode} ${ev.duration || "default"} - ${ev.event_code}`
            : `AskDJ ${ev.mode} ${ev.duration || "default"} - ${ev.event_code}`,
            amount: {
              currency_code: "EUR",
              value: amount,
            },
          },
        ],
        application_context: {
          brand_name: "AskDJ",
          user_action: "PAY_NOW",
          return_url: `${baseAppUrl}/${modePath}/${ev.event_code}?paypal=${isRenew ? "renew_success" : "success"}`,
          cancel_url: `${baseAppUrl}/${modePath}/${ev.event_code}?paypal=${isRenew ? "renew_cancel" : "cancel"}`,
        },
      }),
    });

    const paypalData = await paypalRes.json();

    if (!paypalRes.ok) {
      return NextResponse.json(
        { ok: false, error: paypalData?.message || "Errore PayPal", details: paypalData },
        { status: 500 }
      );
    }

    const orderId = paypalData.id as string;
    const approveLink =
      paypalData.links?.find((l: any) => l.rel === "approve")?.href || null;

    if (!orderId || !approveLink) {
      return NextResponse.json(
        { ok: false, error: "Ordine PayPal incompleto" },
        { status: 500 }
      );
    }

    const { error: upErr } = await supabase
      .from("events")
      .update({ paypal_order_id: orderId })
      .eq("event_code", ev.event_code);

    if (upErr) {
      return NextResponse.json({ ok: false, error: "Errore salvataggio ordine" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      approveUrl: approveLink,
      amount,
      type: orderType,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}