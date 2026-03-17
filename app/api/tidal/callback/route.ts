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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.json(
        { ok: false, error, errorDescription },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Missing authorization code" },
        { status: 400 }
      );
    }

    const clientId = env("TIDAL_CLIENT_ID");
    const clientSecret = env("TIDAL_CLIENT_SECRET");
    const redirectUri = "https://askdj.app/api/tidal/callback";

    const tokenRes = await fetch("https://auth.tidal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("TIDAL TOKEN ERROR:", tokenJson);
      return NextResponse.json(
        { ok: false, error: "Token exchange failed", details: tokenJson },
        { status: 500 }
      );
    }

    const accessToken = tokenJson.access_token as string | undefined;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = Number(tokenJson.expires_in || 0);

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { ok: false, error: "Missing tokens in TIDAL response" },
        { status: 500 }
      );
    }

    const meRes = await fetch("https://openapi.tidal.com/v2/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    });

    const meJson = await meRes.json();

    if (!meRes.ok) {
      console.error("TIDAL USER ERROR:", meJson);
      return NextResponse.json(
        { ok: false, error: "Failed to load TIDAL user", details: meJson },
        { status: 500 }
      );
    }

    const tidalUserId =
      meJson?.data?.id ||
      meJson?.data?.attributes?.userId ||
      meJson?.id ||
      null;

    if (!tidalUserId) {
      return NextResponse.json(
        { ok: false, error: "TIDAL user id not found" },
        { status: 500 }
      );
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: saveError } = await supabase
      .from("tidal_connections")
      .upsert(
        {
          tidal_user_id: String(tidalUserId),
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tidal_user_id" }
      );

    if (saveError) {
      console.error("SUPABASE SAVE ERROR:", saveError);
      return NextResponse.json(
        { ok: false, error: "Failed to save TIDAL connection" },
        { status: 500 }
      );
    }

    return NextResponse.redirect("https://askdj.app/dj");
  } catch (err) {
    console.error("TIDAL CALLBACK ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected callback error" },
      { status: 500 }
    );
  }
}