"use client";

import { useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "@/lib/graphql";
import type { PageRendering } from "./usePageComponents";

/**
 * Resolve rendering IDs to friendly names by querying the rendering definition items.
 * Returns a map of renderingId -> displayName.
 */
export function useRenderingNames(
  client: ClientSDK | null,
  sitecoreContextId: string | undefined,
  renderings: PageRendering[]
): Record<string, string> {
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!client || !sitecoreContextId || renderings.length === 0) return;

    let cancelled = false;

    async function resolve() {
      const ids = [...new Set(renderings.map((r) => r.renderingId))];
      const map: Record<string, string> = {};

      await Promise.all(
        ids.map(async (id) => {
          try {
            const normalizedId = id.replace(/[{}]/g, "");
            const data = await executeGraphQL<{
              item?: { name?: string; displayName?: string } | null;
            }>(
              client!,
              sitecoreContextId!,
              `query {
                item(where: { database: "master", itemId: "${normalizedId}" }) {
                  name
                  displayName
                }
              }`
            );
            const name = data?.item?.displayName || data?.item?.name;
            if (name) map[id] = name;
          } catch {
            // Rendering item not found — keep the ID as name
          }
        })
      );

      if (!cancelled) setNameMap(map);
    }

    resolve();
    return () => { cancelled = true; };
  }, [client, sitecoreContextId, renderings]);

  return nameMap;
}
