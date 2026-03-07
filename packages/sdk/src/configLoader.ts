/**
 * Loads PersonalizeConnect configs for all components on a page
 * from the content tree via Experience Edge GraphQL.
 *
 * Auto-discovers the site path by querying the page item's content tree path,
 * then fetches configs from: {sitePath}/Data/PersonalizeConnect/{pageId}/
 */

import type { PersonalizeConnectConfig } from "./types";
import { log, warn, error as logError, group, groupEnd } from "./logger";

const PAGE_ITEM_PATH_QUERY = `
  query GetPageItemPath($itemId: String!, $language: String!) {
    item(path: $itemId, language: $language) {
      path
    }
  }
`;

const PAGE_CONFIGS_QUERY = `
  query GetPagePersonalizeConfigs($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      children(first: 50) {
        results {
          name
          fields(ownFields: true) {
            name
            jsonValue
          }
        }
      }
    }
  }
`;

interface ConfigField {
  name: string;
  jsonValue: unknown;
}

interface ConfigChildItem {
  name: string;
  fields?: ConfigField[];
}

interface PageConfigsResponse {
  data?: {
    item?: {
      children?: {
        results?: ConfigChildItem[];
      };
    };
  };
  errors?: Array<{ message?: string }>;
}

interface PageItemPathResponse {
  data?: {
    item?: {
      path?: string;
    };
  };
  errors?: Array<{ message?: string }>;
}

function normalizeGuid(id: string): string {
  return id.replace(/[{}]/g, "").toLowerCase();
}

/**
 * Derive site root path from a page's full content tree path.
 * e.g. /sitecore/content/company/company/Home → /sitecore/content/company/company
 */
function deriveSitePath(pageContentPath: string): string {
  const parts = pageContentPath.split("/").filter(Boolean);
  if (parts.length >= 4) {
    return "/" + parts.slice(0, 4).join("/");
  }
  return pageContentPath;
}

function extractFieldValue(fields: ConfigField[] | undefined, fieldName: string): string | undefined {
  if (!fields) return undefined;
  const field = fields.find((f) => f.name === fieldName);
  if (!field) return undefined;
  const jv = field.jsonValue;
  if (typeof jv === "string") return jv;
  if (jv && typeof jv === "object" && "value" in jv) return String((jv as { value: unknown }).value);
  return undefined;
}

interface ParsedConfig {
  config: PersonalizeConnectConfig;
  instanceId?: string;
}

function parseConfigJson(json: string, renderingId: string): ParsedConfig | null {
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const contentMap = (raw.contentMap ?? raw.variantMap) as Record<string, string> | undefined;
    const friendlyId = (raw.friendlyId ?? raw.experienceFriendlyId) as string | undefined;
    if (!contentMap || typeof contentMap !== "object" || !friendlyId) return null;
    const keys = Object.keys(contentMap);
    return {
      config: {
        friendlyId,
        contentMap,
        defaultKey: (raw.defaultKey as string) ?? keys[0] ?? "",
      },
      instanceId: (raw.instanceId as string) ?? undefined,
    };
  } catch {
    warn("Failed to parse config JSON for rendering", renderingId);
    return null;
  }
}

async function queryEdge<T>(
  edgeUrl: string,
  headers: Record<string, string>,
  query: string,
  variables: Record<string, string>
): Promise<T | null> {
  const res = await fetch(edgeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    warn("Edge query non-OK:", res.status, text);
    return null;
  }

  return res.json();
}

/**
 * Auto-discover site path by querying the page item's content tree path,
 * then fetch all PersonalizeConnect configs for the page.
 *
 * @param edgeUrl      Edge GraphQL endpoint (proxy or direct)
 * @param pageItemId   Page item GUID (from __NEXT_DATA__)
 * @param language     Language code
 * @param headers      Optional auth headers (sc_apikey for legacy mode)
 * @param sitePathOverride  Skip auto-discovery and use this path directly
 */
export async function loadPageConfigs(
  edgeUrl: string,
  pageItemId: string,
  language: string,
  headers: Record<string, string> = {},
  sitePathOverride?: string
): Promise<Map<string, PersonalizeConnectConfig>> {
  const configs = new Map<string, PersonalizeConnectConfig>();
  const normalizedPageId = normalizeGuid(pageItemId);

  group("Config loader");

  let sitePath = sitePathOverride;

  if (!sitePath) {
    log("Auto-discovering site path from page item:", pageItemId);

    const pathResponse = await queryEdge<PageItemPathResponse>(
      edgeUrl, headers, PAGE_ITEM_PATH_QUERY, { itemId: pageItemId, language }
    );

    const pageContentPath = pathResponse?.data?.item?.path;
    if (!pageContentPath) {
      warn("Config loader: could not resolve page item path from Edge — page item may not be published");
      log("Query was for itemId:", pageItemId);
      groupEnd();
      return configs;
    }

    sitePath = deriveSitePath(pageContentPath);
    log("Auto-discovered site path:", sitePath, "(from page path:", pageContentPath + ")");
  } else {
    log("Using provided sitePath override:", sitePath);
  }

  const configFolderPath = `${sitePath}/Data/PersonalizeConnect/${normalizedPageId}`;
  log("Fetching configs from:", configFolderPath);

  try {
    const json = await queryEdge<PageConfigsResponse>(
      edgeUrl, headers, PAGE_CONFIGS_QUERY, { path: configFolderPath, language }
    );

    if (!json) {
      groupEnd();
      return configs;
    }

    log("Config loader raw response:", json);

    if (json.errors?.length) {
      warn("Config loader GraphQL errors:", json.errors.map((e) => e.message ?? String(e)).join("; "));
    }

    const children = json.data?.item?.children?.results ?? [];
    log("Config loader: found", children.length, "config items");

    for (const child of children) {
      const configJson = extractFieldValue(child.fields, "Config") ?? extractFieldValue(child.fields, "Value");
      const renderingId = extractFieldValue(child.fields, "RenderingId") ?? child.name.replace(/^config-/, "");

      if (!configJson) {
        warn("Config loader: skipping child", child.name, "— no Config field");
        continue;
      }

      const normalizedRid = normalizeGuid(renderingId);
      const parsed = parseConfigJson(configJson, normalizedRid);
      if (parsed) {
        configs.set(normalizedRid, parsed.config);
        log("Config loader: stored under renderingId", normalizedRid, "→", parsed.config.friendlyId);

        if (parsed.instanceId) {
          const normalizedIid = normalizeGuid(parsed.instanceId);
          configs.set(normalizedIid, parsed.config);
          log("Config loader: also stored under instanceId", normalizedIid);
        }
      }
    }

    log("Config loader: total configs loaded:", configs.size);
  } catch (e) {
    logError("Config loader fetch error:", e);
  }

  groupEnd();

  log("Config loader: result", Object.fromEntries(configs));

  return configs;
}
