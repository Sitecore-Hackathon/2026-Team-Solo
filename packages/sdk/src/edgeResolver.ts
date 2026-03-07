/**
 * Built-in Experience Edge datasource resolver.
 *
 * Legacy mode:    Direct Edge GraphQL with sc_apikey header.
 * Context ID mode: Edge proxy GraphQL — Context ID is the auth, no API key needed.
 */

import type { ComponentFields } from "./types";

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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      query: ITEM_QUERY,
      variables: { itemId: datasourceId, language },
    }),
  });

  if (!res.ok) {
    throw new Error(`Experience Edge request failed: ${res.status}`);
  }

  const json: EdgeItemResponse = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message ?? String(e)).join("; "));
  }

  const fields = json.data?.item?.fields;
  if (!fields || !Array.isArray(fields)) return {};

  return mapFields(fields);
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
