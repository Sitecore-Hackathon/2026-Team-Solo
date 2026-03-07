"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "@/lib/graphql";
import { Button } from "@/components/ui/button";
import { DatasourceSelector } from "@/components/DatasourceSelector";
import { Input } from "@/components/ui/input";
import type { DatasourceItem } from "@/hooks/usePageDatasources";

interface ContentOutcomeMapperProps {
  client: ClientSDK | null;
  sitecoreContextId: string | undefined;
  pagePath: string | undefined;
  contentKeys: string[];
  contentMap: Record<string, string>;
  datasources: DatasourceItem[];
  componentDatasourceId?: string;
  onAddKey: (key: string) => void;
  onRemoveKey: (key: string) => void;
  onContentMapChange: (contentKey: string, datasourceId: string) => void;
}

export function ContentOutcomeMapper({
  client,
  sitecoreContextId,
  pagePath,
  contentKeys,
  contentMap,
  datasources,
  componentDatasourceId,
  onAddKey,
  onRemoveKey,
  onContentMapChange,
}: ContentOutcomeMapperProps) {
  const [newKey, setNewKey] = useState("");
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pathCache, setPathCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const fromDatasources: Record<string, string> = {};
    for (const ds of datasources) {
      fromDatasources[ds.itemId] = ds.path;
    }
    setPathCache((prev) => ({ ...fromDatasources, ...prev }));
  }, [datasources]);

  // Fetch paths for item IDs we don't have (e.g. from saved config)
  const fetchItemPath = useCallback(
    async (itemId: string): Promise<string | null> => {
      if (!client || !sitecoreContextId) return null;
      try {
        const data = await executeGraphQL<{
          item?: { path?: string; name?: string } | null;
        }>(
          client,
          sitecoreContextId,
          `query {
            item(where: { database: "master", itemId: "${itemId.replace(/[{}]/g, "")}" }) {
              path
              name
            }
          }`
        );
        const path = data?.item?.path;
        const name = data?.item?.name;
        return path ?? (name ? `/${name}` : null);
      } catch {
        return null;
      }
    },
    [client, sitecoreContextId]
  );

  useEffect(() => {
    const missing = contentKeys
      .map((k) => contentMap[k])
      .filter((id): id is string => Boolean(id))
      .filter((id) => !pathCache[id]);
    if (missing.length === 0 || !client || !sitecoreContextId) return;
    let cancelled = false;
    (async () => {
      for (const id of [...new Set(missing)]) {
        if (cancelled) return;
        const path = await fetchItemPath(id);
        if (cancelled) return;
        if (path) setPathCache((prev) => ({ ...prev, [id]: path }));
      }
    })();
    return () => { cancelled = true; };
  }, [contentKeys, contentMap, pathCache, client, sitecoreContextId, fetchItemPath]);

  const getDisplayName = (id: string) => {
    const path = pathCache[id] ?? datasources.find((ds) => ds.itemId === id)?.path;
    if (!path) return null;
    const segments = path.split("/");
    return segments[segments.length - 1] || path;
  };

  const handleDatasourceSelect = (contentKey: string, itemId: string, path: string) => {
    onContentMapChange(contentKey, itemId);
    setPathCache((prev) => ({ ...prev, [itemId]: path }));
  };

  const handleAdd = () => {
    const k = newKey.trim().replace(/"/g, "");
    if (k && !contentKeys.includes(k)) {
      onAddKey(k);
      setNewKey("");
    }
  };

  if (pickerKey) {
    return (
      <DatasourceSelector
        client={client}
        sitecoreContextId={sitecoreContextId}
        rootPath={pagePath}
        open={true}
        onOpenChange={() => setPickerKey(null)}
        onSelect={(id, path) => {
          handleDatasourceSelect(pickerKey, id, path);
          setPickerKey(null);
        }}
        selectedId={contentMap[pickerKey] || undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Define which content to show for each variation the experience returns.
      </p>

      {contentKeys.length > 0 && (
        <div className="flex flex-col gap-2">
          {contentKeys.map((key) => (
            <div
              key={key}
              className="group flex items-center gap-3 bg-muted px-3 py-2 transition-colors hover:bg-background"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{key}</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline truncate block max-w-full mt-0.5 text-left"
                  onClick={() => setPickerKey(key)}
                  title={contentMap[key] ? `Item ID: ${contentMap[key]}` : undefined}
                >
                  {contentMap[key]
                    ? (getDisplayName(contentMap[key]) ?? "Content item")
                    : "Choose content item..."}
                </button>
              </div>
              <button
                type="button"
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background hover:text-foreground transition-all"
                onClick={() => onRemoveKey(key)}
                aria-label={`Remove ${key}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="e.g. new-visitor"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          className="h-9 flex-1 text-sm"
        />
        <Button type="button" variant="outline" onClick={handleAdd} className="gap-1.5 shrink-0 h-9 text-sm">
          <Plus className="h-3.5 w-3.5" />
          Add variation
        </Button>
      </div>
    </div>
  );
}
