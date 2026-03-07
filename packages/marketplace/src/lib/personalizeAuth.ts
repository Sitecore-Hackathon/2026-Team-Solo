/**
 * Sitecore Personalize OAuth and API helpers.
 * Auth: https://auth.sitecorecloud.io/oauth/token
 * API: https://api-engage-{region}.sitecorecloud.io (us, eu, ap, jpe)
 */

const AUTH_URL = "https://auth.sitecorecloud.io/oauth/token";
const REGIONS = ["us", "eu", "ap", "jpe"] as const;
export type PersonalizeRegion = (typeof REGIONS)[number];

export function getPersonalizeApiBase(region: string = "us"): string {
  const r = region?.toLowerCase() ?? "us";
  const safe = REGIONS.includes(r as PersonalizeRegion) ? r : "us";
  return `https://api-engage-${safe}.sitecorecloud.io`;
}

export async function exchangeForToken(
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const body = new URLSearchParams({
    client_id: apiKey,
    client_secret: apiSecret,
    grant_type: "client_credentials",
    audience: "https://api.sitecorecloud.io",
  });

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to obtain token: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("No access_token in OAuth response");
  }
  return json.access_token;
}
