import { NextResponse } from "next/server";

function extractTidalTrackId(link: string): string | null {
  const m = String(link || "").match(/track\/(\d+)/);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    const { links } = await req.json();

    if (!links || !Array.isArray(links)) {
      return NextResponse.json({ ok: false, error: "Links mancanti" }, { status: 400 });
    }

    const parsed = links.map((link: string) => ({
      link,
      trackId: extractTidalTrackId(link),
    }));

    return NextResponse.json({
      ok: true,
      processed: links.length,
      parsed,
      inserted: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}