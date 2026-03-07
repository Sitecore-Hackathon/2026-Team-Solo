/**
 * Lightweight Sitecore editing mode detection.
 * Works in Experience Editor and XM Cloud Pages without importing JSS.
 */

let cachedResult: boolean | null = null;

/**
 * Detects whether the page is currently rendered inside a Sitecore editor
 * (Experience Editor or XM Cloud Pages). Result is cached after the first call.
 */
export function isEditingMode(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedResult !== null) return cachedResult;

  const params = new URLSearchParams(window.location.search);

  const scMode = params.get("sc_mode");
  if (scMode && scMode !== "normal") {
    cachedResult = true;
    return true;
  }

  if (params.has("sc_layoutKind") || params.has("sc_itemid")) {
    cachedResult = true;
    return true;
  }

  if (
    document.getElementById("scWebEditRibbon") ||
    document.querySelector("[chrometype]")
  ) {
    cachedResult = true;
    return true;
  }

  cachedResult = false;
  return false;
}

/** Reset the cached result (useful for testing). */
export function resetEditingDetectionCache(): void {
  cachedResult = null;
}
