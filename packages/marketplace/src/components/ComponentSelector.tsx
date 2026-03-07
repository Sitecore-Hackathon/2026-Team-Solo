"use client";

import { Button } from "@/components/ui/button";
import { ConfigBadge } from "./ConfigBadge";
import { cn } from "@/lib/utils";
import type { PageRendering } from "@/hooks/usePageComponents";

interface ComponentSelectorProps {
  components: PageRendering[];
  selectedRendering: PageRendering | null;
  onSelect: (rendering: PageRendering | null) => void;
  configMap: Record<string, boolean>;
}

function ComponentInfoPanel({ rendering }: { rendering: PageRendering }) {
  const rows: Array<{ label: string; value: string }> = [];

  if (rendering.placeholderKey) {
    rows.push({ label: "Placeholder", value: rendering.placeholderKey });
  }
  if (rendering.datasource) {
    rows.push({ label: "Datasource", value: rendering.datasource });
  }
  rows.push({ label: "Rendering", value: rendering.renderingId });
  rows.push({ label: "Instance", value: rendering.instanceId });

  return (
    <div className="border-t border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="font-medium text-foreground/70">{r.label}</dt>
            <dd className="truncate">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ComponentSelector({
  components,
  selectedRendering,
  onSelect,
  configMap,
}: ComponentSelectorProps) {
  if (components.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-input p-4 text-center text-sm text-muted-foreground">
        No components found on this page.
      </div>
    );
  }

  // Collapsed: show only selected component info + back button
  if (selectedRendering) {
    return (
      <div className="space-y-1">
        <div className="overflow-hidden rounded-lg border border-primary">
          <div className="flex items-center justify-between gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2">
            <span className="truncate text-sm font-medium">{selectedRendering.componentName}</span>
            <div className="flex shrink-0 items-center gap-2">
              <ConfigBadge hasConfig={configMap[selectedRendering.instanceId] ?? false} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelect(null)}
                className="h-7 text-xs"
              >
                Change component
              </Button>
            </div>
          </div>
          <ComponentInfoPanel rendering={selectedRendering} />
        </div>
      </div>
    );
  }

  // Expanded: show list of components
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">Select a component</p>
      <div className="flex flex-col gap-1">
        {components.map((r) => (
          <button
            key={r.instanceId}
            type="button"
            onClick={() => onSelect(r)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-input px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
            )}
          >
            <span>{r.componentName}</span>
            <ConfigBadge hasConfig={configMap[r.instanceId] ?? false} />
          </button>
        ))}
      </div>
    </div>
  );
}
