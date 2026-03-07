/**
 * XM Cloud Pages (Page Builder) editing mode detection.
 * Uses the same Sitecore context shape that JSS for XMC writes to __NEXT_DATA__.
 */

import { log } from "./logger";

let cachedResult: boolean | null = null;

interface SitecoreContext {
  pageEditing?: boolean;
  pageState?: "normal" | "edit" | "preview";
}

interface NextData {
  props?: {
    pageProps?: {
      layoutData?: {
        sitecore?: {
          context?: SitecoreContext;
        };
      };
    };
  };
}

function getSitecoreContext(): SitecoreContext | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const nd = (window as unknown as Record<string, unknown>).__NEXT_DATA__ as NextData | undefined;
    return nd?.props?.pageProps?.layoutData?.sitecore?.context;
  } catch {
    return undefined;
  }
}

/**
 * Detects whether the page is rendered inside XM Cloud Pages (Page Builder).
 * Checks the JSS Sitecore context for pageEditing / pageState, and whether
 * the rendering host is loaded in an iframe (Pages always iframes the site).
 * Result is cached after the first call.
 */
export function isEditingMode(): boolean {
  if (typeof window === "undefined") {
    log("Editing detection: SSR — returning false");
    return false;
  }
  if (cachedResult !== null) {
    log("Editing detection: returning cached result", cachedResult);
    return cachedResult;
  }

  log("Editing detection: running checks...");

  const sc = getSitecoreContext();
  log("Editing detection: __NEXT_DATA__ sitecore context:", sc ?? "(not found)");

  if (sc?.pageEditing === true || (sc?.pageState && sc.pageState !== "normal")) {
    log("Editing detection: MATCH — JSS context pageEditing/pageState", { pageEditing: sc.pageEditing, pageState: sc.pageState });
    cachedResult = true;
    return true;
  }

  try {
    const inIframe = window.self !== window.top;
    log("Editing detection: iframe check — window.self !== window.top:", inIframe);
    if (inIframe) {
      log("Editing detection: MATCH — running inside iframe (Page Builder)");
      cachedResult = true;
      return true;
    }
  } catch {
    log("Editing detection: MATCH — cross-origin iframe access threw (Page Builder)");
    cachedResult = true;
    return true;
  }

  log("Editing detection: no match — not in editing mode");
  cachedResult = false;
  return false;
}

/** Reset the cached result (useful for testing). */
export function resetEditingDetectionCache(): void {
  cachedResult = null;
}
