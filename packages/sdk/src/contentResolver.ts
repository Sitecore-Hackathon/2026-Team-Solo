/**
 * Maps contentKey to datasource GUID via contentMap,
 * fetches datasource fields, and falls back to defaultKey on failure.
 */

import type { ComponentFields, PersonalizeConnectConfig } from "./types";

export interface ResolveContentOptions {
  contentKey: string | null;
  config: PersonalizeConnectConfig;
  resolveDatasource: (datasourceId: string) => Promise<ComponentFields>;
}

export interface ResolvedContent {
  datasourceId: string;
  fields: ComponentFields;
}

/**
 * Resolve content key to datasource fields.
 * Falls back to defaultKey if contentKey is null or not in contentMap.
 * Returns null on any fetch failure.
 */
export async function resolveContent(
  options: ResolveContentOptions
): Promise<ResolvedContent | null> {
  const { contentKey, config, resolveDatasource } = options;

  const effectiveKey =
    contentKey && contentKey in config.contentMap ? contentKey : config.defaultKey;
  const datasourceId = config.contentMap[effectiveKey];

  if (!datasourceId || typeof datasourceId !== "string") return null;

  try {
    const fields = await resolveDatasource(datasourceId);
    if (!fields || typeof fields !== "object") return null;
    return { datasourceId, fields };
  } catch {
    return null;
  }
}
