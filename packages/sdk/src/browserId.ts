/**
 * Manages the Sitecore CDP browser ID cookie (bid_<clientKey>).
 * Used for session continuity across Personalize decisions.
 */

const COOKIE_PREFIX = "bid_";
const COOKIE_MAX_AGE = 63072000; // 2 years in seconds
const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "Lax";

function generateBrowserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older environments
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
 * Get or create the browser ID for the given client key.
 * Reads from cookie bid_<clientKey>, writes if missing, and returns the value.
 */
export function getBrowserId(clientKey: string): string {
  const cookieName = COOKIE_PREFIX + clientKey;
  let bid = getCookie(cookieName);
  if (!bid || typeof bid !== "string" || bid.length < 10) {
    bid = generateBrowserId();
    setCookie(cookieName, bid);
  }
  return bid;
}
