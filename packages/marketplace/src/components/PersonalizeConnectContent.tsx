"use client";

import { useEffect } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { PersonalizeCredentials } from "@/lib/credentials-store";
import { getSitePathFromPagePath } from "@/lib/config-store";
import { ComponentSelector } from "@/components/ComponentSelector";
import { ExperienceMappingPanel } from "@/components/ExperienceMappingPanel";
import { usePageComponents } from "@/hooks/usePageComponents";
import type { PageRendering } from "@/hooks/usePageComponents";
import { usePageDatasources } from "@/hooks/usePageDatasources";
import { usePersonalizeExperiences } from "@/hooks/usePersonalizeExperiences";
import { useComponentConfig } from "@/hooks/useComponentConfig";
import { useRenderingNames } from "@/hooks/useRenderingNames";

interface PersonalizeConnectContentProps {
  client: ClientSDK;
  sitecoreContextId: string;
  pageId: string;
  pagePath: string;
  presentationDetails?: string;
  credentials: PersonalizeCredentials;
}

export function PersonalizeConnectContent({
  client,
  sitecoreContextId,
  pageId,
  pagePath,
  presentationDetails,
  credentials,
}: PersonalizeConnectContentProps) {
  const sitePath = getSitePathFromPagePath(pagePath);
  const { datasources, pageDetails, loading: datasourcesLoading } = usePageDatasources(
    client,
    sitecoreContextId,
    pageId,
    pagePath
  );

  const rawComponents = usePageComponents(presentationDetails || pageDetails?.presentationDetails);

  // Resolve rendering GUIDs to friendly names
  const nameMap = useRenderingNames(client, sitecoreContextId, rawComponents);
  const components: PageRendering[] = rawComponents.map((c) => ({
    ...c,
    componentName: nameMap[c.renderingId] ?? c.componentName,
  }));

  const {
    experiences,
    loading: experiencesLoading,
    fetchExperiences,
    fetchExperienceDetail,
  } = usePersonalizeExperiences(credentials);

  const {
    selectedRendering,
    setSelectedRendering,
    selectedExperience,
    contentKeys,
    contentMap,
    configMap,
    handleExperienceSelect,
    handleAddContentKey,
    handleRemoveContentKey,
    handleContentMapChange,
    handleSave,
  } = useComponentConfig({
    client,
    sitecoreContextId,
    sitePath,
    pageId,
    fetchExperienceDetail,
  });

  // Fetch experiences when credentials are available
  useEffect(() => {
    if (credentials?.apiKey && credentials?.apiSecret) {
      fetchExperiences();
    }
  }, [credentials?.apiKey, credentials?.apiSecret, fetchExperiences]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Personalize Connect</h1>
        <p className="text-sm text-muted-foreground">
          Link components to Sitecore Personalize experiences
        </p>
      </header>

      <ComponentSelector
        components={components}
        selectedRendering={selectedRendering}
        onSelect={setSelectedRendering}
        configMap={configMap}
      />

      {selectedRendering && (
        <ExperienceMappingPanel
          client={client}
          sitecoreContextId={sitecoreContextId}
          pagePath={pagePath}
          experiences={experiences}
          experiencesLoading={experiencesLoading}
          selectedExperience={selectedExperience}
          componentDatasourceId={selectedRendering?.datasource}
          datasources={datasources}
          contentKeys={contentKeys}
          contentMap={contentMap}
          datasourcesLoading={datasourcesLoading}
          onExperienceSelect={handleExperienceSelect}
          onAddContentKey={handleAddContentKey}
          onRemoveContentKey={handleRemoveContentKey}
          onContentMapChange={handleContentMapChange}
          onSave={handleSave}
          onRefreshExperiences={fetchExperiences}
        />
      )}
    </div>
  );
}
