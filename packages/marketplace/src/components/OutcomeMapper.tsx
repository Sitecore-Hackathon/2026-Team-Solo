"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonalizeVariant } from "@/hooks/usePersonalizeExperiences";
import type { DatasourceItem } from "@/hooks/usePageDatasources";

interface VariantMapperProps {
  variants: PersonalizeVariant[];
  datasources: DatasourceItem[];
  contentMap: Record<string, string>;
  defaultKey: string;
  onContentMapChange: (contentKey: string, datasourceId: string) => void;
  onDefaultKeyChange: (contentKey: string) => void;
}

const KEEP_EXISTING = "__keep_existing__";

export function VariantMapper({
  variants,
  datasources,
  contentMap,
  defaultKey,
  onContentMapChange,
  onDefaultKeyChange,
}: VariantMapperProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Map variants to datasources (contentKey → datasource)</p>
      <div className="space-y-2">
        {variants.map((v) => {
          const key = v.ref ?? v.name ?? "";
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">
                {v.name ?? v.ref ?? "Variant"}
                {v.isControl ? " (control)" : ""}
              </span>
              <Select
                value={contentMap[key] ? contentMap[key] : KEEP_EXISTING}
                onValueChange={(val) =>
                  onContentMapChange(key, val === KEEP_EXISTING ? "" : val)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Keep existing datasource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KEEP_EXISTING}>
                    Keep existing datasource
                  </SelectItem>
                  {datasources.map((ds) => (
                    <SelectItem key={ds.itemId} value={ds.itemId}>
                      {ds.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Default variant (fallback if experience fails)</p>
        <Select value={defaultKey} onValueChange={onDefaultKeyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select default variant" />
          </SelectTrigger>
          <SelectContent>
            {variants.map((v) => {
              const key = v.ref ?? v.name ?? "";
              return (
                <SelectItem key={key} value={key}>
                  {v.name ?? v.ref ?? "Variant"}
                  {v.isControl ? " (control)" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
