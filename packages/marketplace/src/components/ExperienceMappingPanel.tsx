"use client";

import { ContentOutcomeMapper } from "@/components/ContentOutcomeMapper";
import { ExperiencePicker } from "@/components/ExperiencePicker";
import type { DatasourceItem } from "@/hooks/usePageDatasources";

interface ExperienceMappingPanelProps {
  client: import("@sitecore-marketplace-sdk/client").ClientSDK | null;
  sitecoreContextId: string | undefined;
  pagePath: string | undefined;
  experiences: Array<{ id: string; friendlyId?: string; name?: string; status?: string }>;
  experiencesLoading: boolean;
  selectedExperience: { id: string; friendlyId?: string; name?: string } | null;
  componentDatasourceId?: string;
  datasources: DatasourceItem[];
  contentKeys: string[];
  contentMap: Record<string, string>;
  datasourcesLoading: boolean;
  onExperienceSelect: (exp: { id: string; friendlyId?: string; name?: string } | null) => void;
  onAddContentKey: (key: string) => void;
  onRemoveContentKey: (key: string) => void;
  onContentMapChange: (contentKey: string, datasourceId: string) => void;
  onRefreshExperiences?: () => void;
}

export function ExperienceMappingPanel({
  client,
  sitecoreContextId,
  pagePath,
  experiences,
  experiencesLoading,
  selectedExperience,
  componentDatasourceId,
  datasources,
  contentKeys,
  contentMap,
  onExperienceSelect,
  onAddContentKey,
  onRemoveContentKey,
  onContentMapChange,
  onRefreshExperiences,
}: ExperienceMappingPanelProps) {
  return (
    <>
      <ExperiencePicker
        experiences={experiences}
        loading={experiencesLoading}
        selectedExperience={selectedExperience}
        onSelect={onExperienceSelect}
        onRefresh={onRefreshExperiences}
      />

      {selectedExperience && (
        <ContentOutcomeMapper
          client={client}
          sitecoreContextId={sitecoreContextId}
          pagePath={pagePath}
          contentKeys={contentKeys}
          contentMap={contentMap}
          datasources={datasources}
          componentDatasourceId={componentDatasourceId}
          onAddKey={onAddContentKey}
          onRemoveKey={onRemoveContentKey}
          onContentMapChange={onContentMapChange}
        />
      )}
    </>
  );
}
