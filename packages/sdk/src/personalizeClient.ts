/**
 * Calls Sitecore Personalize to resolve the active content key.
 *
 * Legacy mode:  POST https://api.boxever.com/v2/callFlows
 * Context ID:   POST {edgeUrl}/v1/personalize?sitecoreContextId=...&siteName=...
 */

import type { CallFlowsRequest, PersonalizeConnectConfig, PersonalizeConnectResponse } from "./types";
import type { PersonalizeContextValue } from "./types";
import { log, warn, error as logError, group, groupEnd } from "./logger";

const DEFAULT_API_BASE = "https://api.boxever.com";

export interface CallPersonalizeOptions {
  config: PersonalizeConnectConfig;
  context: PersonalizeContextValue;
  /** Override API base URL (legacy mode only) */
  apiBase?: string;
  componentRef?: string;
  pageRoute?: string;
}

export async function callPersonalize(options: CallPersonalizeOptions): Promise<string | null> {
  const { config, context, apiBase = DEFAULT_API_BASE, componentRef, pageRoute } = options;

  group(`callPersonalize [${config.friendlyId}]`);
  log("Config:", { friendlyId: config.friendlyId, defaultKey: config.defaultKey, contentMapKeys: Object.keys(config.contentMap) });
  log("BrowserId:", context.browserId || "(empty — call will likely fail)");

  if (!context.browserId) {
    warn("BrowserId is empty — personalize call may fail or return default");
  }

  let result: string | null;
  if (context.useEdgeProxy) {
    log("Route: Edge proxy");
    result = await callViaEdgeProxy(config, context, componentRef, pageRoute);
  } else {
    log("Route: Legacy /v2/callFlows", { apiBase });
    result = await callViaLegacy(config, context, apiBase, componentRef, pageRoute);
  }

  log("Result contentKey:", result ?? "(null — will use defaultKey)");
  groupEnd();
  return result;
}

async function callViaEdgeProxy(
  config: PersonalizeConnectConfig,
  context: PersonalizeContextValue,
  componentRef?: string,
  pageRoute?: string
): Promise<string | null> {
  const base = context.edgeProxyUrl.replace(/\/$/, "");
  const url =
    `${base}/v1/personalize` +
    `?sitecoreContextId=${encodeURIComponent(context.sitecoreEdgeContextId)}` +
    `&siteName=${encodeURIComponent(context.siteName)}`;

  const body: Record<string, unknown> = {
    channel: context.channel,
    language: context.language,
    currencyCode: context.currencyCode,
    browserId: context.browserId,
    friendlyId: config.friendlyId,
  };

  if (componentRef || pageRoute) {
    const params: Record<string, unknown> = {};
    if (componentRef) params.componentRef = componentRef;
    if (pageRoute) params.pageRoute = pageRoute;
    body.params = params;
  }

  log("Edge proxy POST", url);
  log("Request body:", body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), context.timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    log("Edge proxy response status:", res.status);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      warn("Edge proxy non-OK response:", res.status, text);
      return null;
    }
    const data = await res.json();
    log("Edge proxy response body:", data);
    return extractContentKey(data);
  } catch (e) {
    clearTimeout(timeoutId);
    logError("Edge proxy fetch error:", e);
    return null;
  }
}

async function callViaLegacy(
  config: PersonalizeConnectConfig,
  context: PersonalizeContextValue,
  apiBase: string,
  componentRef?: string,
  pageRoute?: string
): Promise<string | null> {
  const body: CallFlowsRequest = {
    clientKey: context.clientKey,
    channel: context.channel,
    language: context.language,
    currencyCode: context.currencyCode,
    pointOfSale: context.pointOfSale,
    browserId: context.browserId,
    friendlyId: config.friendlyId,
  };

  if (componentRef || pageRoute) {
    body.params = {};
    if (componentRef) body.params.componentRef = componentRef;
    if (pageRoute) body.params.pageRoute = pageRoute;
  }

  const url = `${apiBase.replace(/\/$/, "")}/v2/callFlows`;
  log("Legacy POST", url);
  log("Request body:", body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), context.timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    log("Legacy response status:", res.status);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      warn("Legacy non-OK response:", res.status, text);
      return null;
    }
    const data = await res.json();
    log("Legacy response body:", data);
    return extractContentKey(data);
  } catch (e) {
    clearTimeout(timeoutId);
    logError("Legacy fetch error:", e);
    return null;
  }
}

function extractContentKey(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const contentKey = (data as PersonalizeConnectResponse).contentKey;
  if (typeof contentKey !== "string" || contentKey.trim() === "") return null;
  return contentKey;
}
