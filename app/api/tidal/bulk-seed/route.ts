import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { links } = await req.json();

    if (!links || !Array.isArray(links)) {
      return NextResponse.json({ ok: false, error: "Links mancanti" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      processed: links.length,
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