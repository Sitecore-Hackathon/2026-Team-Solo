import { NextRequest, NextResponse } from "next/server";
import { getFlow } from "@/lib/personalizeApi";
import {
  exchangeForToken,
  getPersonalizeApiBase,
} from "@/lib/personalizeAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Experience ID required" }, { status: 400 });
  }

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
    const flow = await getFlow(apiBase, token, id);
    return NextResponse.json(flow);
  } catch (e) {
    console.error("Personalize experience fetch error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch experience" },
      { status: 502 }
    );
  }
}
