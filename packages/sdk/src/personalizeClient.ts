/**
 * Calls Sitecore Personalize to resolve the active content key.
 *
 * Legacy mode:  POST https://api.boxever.com/v2/callFlows
 * Context ID:   POST {edgeUrl}/v1/personalize?sitecoreContextId=...&siteName=...
 */

import type { CallFlowsRequest, PersonalizeConnectConfig, PersonalizeConnectResponse } from "./types";
import type { PersonalizeContextValue } from "./types";

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

  if (context.useEdgeProxy) {
    return callViaEdgeProxy(config, context, componentRef, pageRoute);
  }
  return callViaLegacy(config, context, apiBase, componentRef, pageRoute);
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
    if (!res.ok) return null;
    return extractContentKey(await res.json());
  } catch {
    clearTimeout(timeoutId);
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), context.timeout);

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/v2/callFlows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return extractContentKey(await res.json());
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function extractContentKey(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const contentKey = (data as PersonalizeConnectResponse).contentKey;
  if (typeof contentKey !== "string" || contentKey.trim() === "") return null;
  return contentKey;
}
