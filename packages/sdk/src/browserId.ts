/**
 * Manages the Sitecore CDP browser ID.
 *
 * Legacy mode:  cookie bid_<clientKey>, generated locally.
 * Context ID mode: fetched from Edge proxy /v1/init, stored in cookie sc_<contextId>_personalize.
 */

const LEGACY_COOKIE_PREFIX = "bid_";
const CONTEXT_COOKIE_PREFIX = "sc_";
const CONTEXT_COOKIE_SUFFIX = "_personalize";
const COOKIE_MAX_AGE = 63072000; // 2 years
const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "Lax";

function generateBrowserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + encodeURIComponent(name) + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie =
    encodeURIComponent(name) +
    "=" +
    encodeURIComponent(value) +
    "; path=" +
    COOKIE_PATH +
    "; max-age=" +
    COOKIE_MAX_AGE +
    "; SameSite=" +
    COOKIE_SAME_SITE;
}

/**
 * Legacy: get or create browser ID from a local cookie keyed by clientKey.
 */
export function getBrowserId(clientKey: string): string {
  const cookieName = LEGACY_COOKIE_PREFIX + clientKey;
  let bid = getCookie(cookieName);
  if (!bid || typeof bid !== "string" || bid.length < 10) {
    bid = generateBrowserId();
    setCookie(cookieName, bid);
  }
  return bid;
}

/** Response shape from the Edge proxy /v1/init endpoint */
export interface EdgeInitResponse {
  browserId: string;
  guestId?: string;
}

let edgeInitPromise: Promise<EdgeInitResponse> | null = null;

/**
 * Context ID mode: fetch browser ID from the Edge proxy init endpoint.
 * Checks cookie first; if missing, calls /v1/init and caches the result.
 */
export async function getEdgeBrowserId(
  edgeUrl: string,
  contextId: string,
  siteName: string
): Promise<string> {
  const cookieName = CONTEXT_COOKIE_PREFIX + contextId + CONTEXT_COOKIE_SUFFIX;
  const cached = getCookie(cookieName);
  if (cached && cached.length >= 10) return cached;

  if (!edgeInitPromise) {
    edgeInitPromise = fetchEdgeInit(edgeUrl, contextId, siteName);
  }

  try {
    const result = await edgeInitPromise;
    setCookie(cookieName, result.browserId);
    return result.browserId;
  } catch {
    const fallback = generateBrowserId();
    setCookie(cookieName, fallback);
    return fallback;
  } finally {
    edgeInitPromise = null;
  }
}

async function fetchEdgeInit(
  edgeUrl: string,
  contextId: string,
  siteName: string
): Promise<EdgeInitResponse> {
  const base = edgeUrl.replace(/\/$/, "");
  const url = `${base}/v1/init?sitecoreContextId=${encodeURIComponent(contextId)}&siteName=${encodeURIComponent(siteName)}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Edge init failed: ${res.status}`);
  }

  const data = (await res.json()) as EdgeInitResponse;
  if (!data.browserId || typeof data.browserId !== "string") {
    throw new Error("Edge init response missing browserId");
  }
  return data;
}

/** Reset the cached init promise (for testing). */
export function resetEdgeInitCache(): void {
  edgeInitPromise = null;
}
