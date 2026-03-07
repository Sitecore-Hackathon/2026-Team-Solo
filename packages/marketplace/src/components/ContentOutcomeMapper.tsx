"use client";

import { useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
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

  const getDisplayPath = (id: string) =>
    pathCache[id] ?? datasources.find((ds) => ds.itemId === id)?.path ?? id;

  const handleDatasourceSelect = (contentKey: string, itemId: string, path: string) => {
    onContentMapChange(contentKey, itemId);
    setPathCache((prev) => ({ ...prev, [itemId]: path }));
  };

  const componentDatasourcePath =
    componentDatasourceId &&
    (datasources.find((ds) => ds.itemId === componentDatasourceId)?.path ?? componentDatasourceId);

  const handleAdd = () => {
    const k = newKey.trim().replace(/"/g, "");
    if (k && !contentKeys.includes(k)) {
      onAddKey(k);
      setNewKey("");
    }
  };

  return (
    <div className="space-y-4 relative">
      {pickerKey ? (
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
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium">Content outcomes</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Map experience keys to datasources. Ensure the experience returns one of these keys.
              </p>
            </div>
            {componentDatasourcePath && (
              <div className="rounded-md border border-input bg-muted/30 px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">Component: </span>
                <span className="font-mono">{componentDatasourcePath}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {contentKeys.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-muted-foreground">Content key</span>
                  <span className="text-xs font-medium text-muted-foreground">Datasource</span>
                </div>
                {contentKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 truncate rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono">
                      &quot;{key}&quot;
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-0 flex-1 justify-between font-normal"
                      onClick={() => setPickerKey(key)}
                    >
                      <span className="truncate">
                        {contentMap[key] ? getDisplayPath(contentMap[key]) : "Select datasource"}
                      </span>
                      <span className="shrink-0 opacity-50">▼</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemoveKey(key)}
                      aria-label={`Remove ${key}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </Button>
                  </div>
            ))}
          </div>
        )}

            <div className="flex items-center gap-2">
              <Input
                placeholder='Add key, e.g. "new-visitor"'
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                className="h-8 flex-1 text-sm sm:max-w-[200px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add key
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
