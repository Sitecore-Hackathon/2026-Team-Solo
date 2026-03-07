/**
 * Built-in Experience Edge datasource resolver.
 *
 * Legacy mode:    Direct Edge GraphQL with sc_apikey header.
 * Context ID mode: Edge proxy GraphQL — Context ID is the auth, no API key needed.
 */

import type { ComponentFields } from "./types";
import { log, warn, error as logError } from "./logger";

const ITEM_QUERY = `
  query GetDatasourceItem($itemId: String!, $language: String!) {
    item(path: $itemId, language: $language) {
      fields(ownFields: true) {
        name
        jsonValue
      }
    }
  }
`;

interface EdgeField {
  name: string;
  jsonValue: unknown;
}

interface EdgeItemResponse {
  data?: {
    item?: {
      fields?: EdgeField[];
    };
  };
  errors?: Array<{ message?: string }>;
}

/**
 * Formats a compact GUID (32 hex chars, no hyphens) into standard format.
 * e.g. "a2c7b6e142154c839cc20779f9bf80e5" → "{a2c7b6e1-4215-4c83-9cc2-0779f9bf80e5}"
 * Already-formatted GUIDs are returned as-is.
 */
function formatGuidForEdge(id: string): string {
  const clean = id.replace(/[{}\-\s]/g, "").toLowerCase();
  if (clean.length !== 32 || !/^[0-9a-f]+$/.test(clean)) return id;
  return `{${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}}`;
}

function mapFields(fields: EdgeField[]): ComponentFields {
  const result: ComponentFields = {};
  for (const field of fields) {
    if (field.name && field.jsonValue !== undefined) {
      result[field.name] = field.jsonValue;
    }
  }
  return result;
}

async function queryEdge(
  url: string,
  headers: Record<string, string>,
  datasourceId: string,
  language: string
): Promise<ComponentFields> {
  const formattedId = formatGuidForEdge(datasourceId);
  log("Edge GraphQL request:", { url, datasourceId, formattedId, language });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      query: ITEM_QUERY,
      variables: { itemId: formattedId, language },
    }),
  });

  log("Edge GraphQL response status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logError("Edge GraphQL non-OK response:", res.status, text);
    throw new Error(`Experience Edge request failed: ${res.status}`);
  }

  const json: EdgeItemResponse = await res.json();

  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message ?? String(e)).join("; ");
    logError("Edge GraphQL errors:", msg);
    throw new Error(msg);
  }

  const fields = json.data?.item?.fields;
  if (!fields || !Array.isArray(fields)) {
    warn("Edge GraphQL: item not found or has no fields for", datasourceId);
    return {};
  }

  const mapped = mapFields(fields);
  log("Edge GraphQL resolved fields:", { datasourceId, fieldCount: Object.keys(mapped).length, fieldNames: Object.keys(mapped) });
  return mapped;
}

/**
 * Legacy: creates a resolver that calls Experience Edge directly with an API key.
 */
export function createEdgeResolver(
  edgeUrl: string,
  apiKey: string,
  language = "en"
): (datasourceId: string) => Promise<ComponentFields> {
  return (datasourceId) =>
    queryEdge(edgeUrl, { sc_apikey: apiKey }, datasourceId, language);
}

/**
 * Context ID mode: creates a resolver that calls the Edge proxy GraphQL endpoint.
 * No API key header — the Context ID in the URL is the auth.
 */
export function createEdgeProxyResolver(
  edgeBaseUrl: string,
  contextId: string,
  language = "en"
): (datasourceId: string) => Promise<ComponentFields> {
  const base = edgeBaseUrl.replace(/\/$/, "");
  const url = `${base}/v1/content/api/graphql/v1?sitecoreContextId=${encodeURIComponent(contextId)}`;
  return (datasourceId) => queryEdge(url, {}, datasourceId, language);
}
