"use client";

import { useState } from "react";
import { ConfigBadge } from "./ConfigBadge";
import { cn } from "@/lib/utils";
import type { PageRendering } from "@/hooks/usePageComponents";

interface ComponentSelectorProps {
  components: PageRendering[];
  selectedRendering: PageRendering | null;
  onSelect: (rendering: PageRendering | null) => void;
  configMap: Record<string, boolean>;
}

export function ComponentSelector({
  components,
  selectedRendering,
  onSelect,
  configMap,
}: ComponentSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (components.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No components found on this page.
      </p>
    );
  }

  if (selectedRendering) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium">
            {selectedRendering.componentName}
            <ConfigBadge hasConfig={configMap[selectedRendering.instanceId] ?? false} />
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-primary hover:underline"
          >
            Change
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
        {showDetails && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground pl-1">
            {selectedRendering.placeholderKey && (
              <>
                <dt className="font-medium">Placeholder</dt>
                <dd className="truncate">{selectedRendering.placeholderKey}</dd>
              </>
            )}
            {selectedRendering.datasource && (
              <>
                <dt className="font-medium">Datasource</dt>
                <dd className="truncate">{selectedRendering.datasource}</dd>
              </>
            )}
            <dt className="font-medium">Rendering</dt>
            <dd className="truncate">{selectedRendering.renderingId}</dd>
          </dl>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Which component do you want to personalize?
      </p>
      <div className="bg-muted p-1.5">
        <div className="flex flex-col gap-0.5">
          {components.map((r) => (
            <button
              key={r.instanceId}
              type="button"
              onClick={() => onSelect(r)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-background"
              )}
            >
              <span>{r.componentName}</span>
              <ConfigBadge hasConfig={configMap[r.instanceId] ?? false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
