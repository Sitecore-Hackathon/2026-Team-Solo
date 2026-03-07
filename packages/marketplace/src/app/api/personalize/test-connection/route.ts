import { NextRequest, NextResponse } from "next/server";
import { exchangeForToken } from "@/lib/personalizeAuth";

export async function POST(req: NextRequest) {
  let body: { apiKey?: string; apiSecret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON with apiKey and apiSecret" },
      { status: 400 }
    );
  }

  const apiKey = body.apiKey;
  const apiSecret = body.apiSecret;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "API Key and API Secret are required." },
      { status: 400 }
    );
  }

  try {
    await exchangeForToken(apiKey, apiSecret);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Connection failed" },
      { status: 401 }
    );
  }
}
