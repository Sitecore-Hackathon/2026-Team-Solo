/**
 * Built-in Experience Edge datasource resolver.
 * Queries Experience Edge GraphQL by item GUID, returns fields in JSS shape.
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

/**
 * Creates a datasource resolver backed by Experience Edge GraphQL.
 * When passed as (or used in place of) `resolveDatasource`, allows the SDK
 * to fetch datasource fields without the consuming app providing any resolver.
 */
export function createEdgeResolver(
  edgeUrl: string,
  apiKey: string,
  language = "en"
): (datasourceId: string) => Promise<ComponentFields> {
  return async (datasourceId: string): Promise<ComponentFields> => {
    const res = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sc_apikey: apiKey,
      },
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

    const result: ComponentFields = {};
    for (const field of fields) {
      if (field.name && field.jsonValue !== undefined) {
        result[field.name] = field.jsonValue;
      }
    }
    return result;
  };
}
