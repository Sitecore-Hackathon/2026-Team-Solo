import { NextRequest, NextResponse } from "next/server";
import { listFlows } from "@/lib/personalizeApi";
import {
  exchangeForToken,
  getPersonalizeApiBase,
} from "@/lib/personalizeAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: { apiKey?: string; apiSecret?: string; region?: string };
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
  const region = body.region ?? "us";

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "API Key and API Secret are required." },
      { status: 400 }
    );
  }

  try {
    const token = await exchangeForToken(apiKey, apiSecret);
    const apiBase = getPersonalizeApiBase(region);
    const flows = await listFlows(apiBase, token);
    return NextResponse.json(flows, { headers: CORS_HEADERS });
  } catch (e) {
    console.error("Personalize experiences fetch error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch experiences" },
      { status: 502 }
    );
  }
}
