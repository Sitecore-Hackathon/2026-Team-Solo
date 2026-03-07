/**
 * Maps contentKey to datasource GUID via contentMap,
 * fetches datasource fields, and falls back to defaultKey on failure.
 */

import type { ComponentFields, PersonalizeConnectConfig } from "./types";
import { log, warn, error as logError } from "./logger";

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

  const keyInMap = contentKey && contentKey in config.contentMap;
  const effectiveKey = keyInMap ? contentKey! : config.defaultKey;

  if (!keyInMap) {
    warn(
      `Content key "${contentKey}" not found in contentMap [${Object.keys(config.contentMap).join(", ")}], falling back to defaultKey "${config.defaultKey}"`
    );
  }

  const datasourceId = config.contentMap[effectiveKey];
  log("Resolving datasource:", { effectiveKey, datasourceId });

  if (!datasourceId || typeof datasourceId !== "string") {
    warn(`No datasource ID for key "${effectiveKey}" — contentMap may be misconfigured`);
    return null;
  }

  try {
    const fields = await resolveDatasource(datasourceId);
    if (!fields || typeof fields !== "object") {
      warn("resolveDatasource returned empty/invalid fields for", datasourceId);
      return null;
    }
    log("Datasource resolved:", { datasourceId, fieldNames: Object.keys(fields) });
    return { datasourceId, fields };
  } catch (e) {
    logError("resolveDatasource threw for", datasourceId, e);
    return null;
  }
}
