import { NextResponse } from "next/server";

export async function GET() {

  const clientId = process.env.TIDAL_CLIENT_ID!;
  const redirectUri = encodeURIComponent("https://askdj.app/api/tidal/callback");

  const scope = encodeURIComponent(
    "playlists.read playlists.write user.read"
  );

  const authUrl =
    `https://login.tidal.com/authorize` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}