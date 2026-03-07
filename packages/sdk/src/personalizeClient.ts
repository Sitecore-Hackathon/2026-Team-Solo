/**
 * Thin async wrapper around POST /v2/callFlows.
 * Enforces timeout, parses response, validates contentKey.
 */

import type { CallFlowsRequest, PersonalizeConnectConfig, PersonalizeConnectResponse } from "./types";
import type { PersonalizeContextValue } from "./types";

const DEFAULT_API_BASE = "https://api.boxever.com";

export interface CallPersonalizeOptions {
  config: PersonalizeConnectConfig;
  context: PersonalizeContextValue;
  /** Optional: override API base URL (e.g. region-specific) */
  apiBase?: string;
  /** Optional: component ref for params */
  componentRef?: string;
  /** Optional: page route for params */
  pageRoute?: string;
}

/**
 * Call Personalize /v2/callFlows to get the active content key.
 * Returns the contentKey on success, null on any failure.
 */
export async function callPersonalize(options: CallPersonalizeOptions): Promise<string | null> {
  const { config, context, apiBase = DEFAULT_API_BASE, componentRef, pageRoute } = options;

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

    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;

    const contentKey = (data as PersonalizeConnectResponse).contentKey;
    if (typeof contentKey !== "string" || contentKey.trim() === "") return null;

    return contentKey;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
