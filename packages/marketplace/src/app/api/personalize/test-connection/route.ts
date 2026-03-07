import { NextRequest, NextResponse } from "next/server";
import { exchangeForToken } from "@/lib/personalizeAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

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
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Connection failed" },
      { status: 401 }
    );
  }
}
