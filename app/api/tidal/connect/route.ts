import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeCodeVerifier() {
  return toBase64Url(randomBytes(64));
}

function makeCodeChallenge(verifier: string) {
  return toBase64Url(createHash("sha256").update(verifier).digest());
}

export async function GET() {
  const clientId = env("TIDAL_CLIENT_ID");
  const redirectUri = "https://askdj.app/api/tidal/callback";
  const scope = "playlists.read playlists.write user.read";

  const codeVerifier = makeCodeVerifier();
  const codeChallenge = makeCodeChallenge(codeVerifier);
  const state = toBase64Url(randomBytes(24));

  const authUrl =
    `https://login.tidal.com/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256` +
    `&state=${encodeURIComponent(state)}`;

  const res = NextResponse.redirect(authUrl);

  res.cookies.set("tidal_pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  res.cookies.set("tidal_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return res;
}