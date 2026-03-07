"use client";

import { useEffect, useMemo } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { PersonalizeCredentials } from "@/lib/credentials-store";
import { getSitePathFromPagePath } from "@/lib/config-store";
import { StepSection } from "@/components/StepSection";
import { ComponentSelector } from "@/components/ComponentSelector";
import { ExperiencePicker } from "@/components/ExperiencePicker";
import { ContentOutcomeMapper } from "@/components/ContentOutcomeMapper";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/SaveButton";
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
  const { datasources, pageDetails } = usePageDatasources(
    client,
    sitecoreContextId,
    pageId,
    pagePath
  );

  const rawComponents = usePageComponents(presentationDetails || pageDetails?.presentationDetails);
  const nameMap = useRenderingNames(client, sitecoreContextId, rawComponents);
  const components = useMemo<PageRendering[]>(
    () =>
      rawComponents.map((c) => ({
        ...c,
        componentName: nameMap[c.renderingId] ?? c.componentName,
      })),
    [rawComponents, nameMap]
  );

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
    components,
    fetchExperienceDetail,
  });

  useEffect(() => {
    if (credentials?.apiKey && credentials?.apiSecret) {
      fetchExperiences();
    }
  }, [credentials?.apiKey, credentials?.apiSecret, fetchExperiences]);

  const stepOneState = selectedRendering ? "complete" as const : "active" as const;
  const stepTwoState = selectedRendering
    ? selectedExperience ? "complete" as const : "active" as const
    : "pending" as const;
  const stepThreeState = selectedExperience ? "active" as const : "pending" as const;

  const canSave = !!(selectedRendering && selectedExperience);

  return (
    <div className="flex flex-col p-5">
      <header className="mb-5">
        <h1 className="text-base font-semibold">Personalize Connect</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Link page components to Sitecore Personalize experiences
        </p>
      </header>

      <div className="flex-1 min-h-0">
        <StepSection
          step={1}
          title="Pick a component"
          subtitle="Choose which component you want to personalize on this page."
          state={stepOneState}
        >
          <ComponentSelector
            components={components}
            selectedRendering={selectedRendering}
            onSelect={setSelectedRendering}
            configMap={configMap}
          />
        </StepSection>

        <StepSection
          step={2}
          title="Connect an experience"
          subtitle="Link to a Sitecore Personalize experience."
          state={stepTwoState}
        >
          <ExperiencePicker
            experiences={experiences}
            loading={experiencesLoading}
            selectedExperience={selectedExperience}
            onSelect={handleExperienceSelect}
            onRefresh={fetchExperiences}
          />
        </StepSection>

        <StepSection
          step={3}
          title="Map content variations"
          subtitle="Define alternate content for each variation the experience returns."
          state={stepThreeState}
        >
          <ContentOutcomeMapper
            client={client}
            sitecoreContextId={sitecoreContextId}
            pagePath={pagePath}
            contentKeys={contentKeys}
            contentMap={contentMap}
            datasources={datasources}
            componentDatasourceId={selectedRendering?.datasource}
            onAddKey={handleAddContentKey}
            onRemoveKey={handleRemoveContentKey}
            onContentMapChange={handleContentMapChange}
          />
        </StepSection>
      </div>

      <div className="pt-4 border-t border-border mt-4 flex justify-between items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSelectedRendering(null)}
          className="text-muted-foreground"
        >
          Reset
        </Button>
        <SaveButton
          onSave={async () => {
            await handleSave();
            setSelectedRendering(null);
          }}
          disabled={!canSave}
        >
          Save
        </SaveButton>
      </div>
    </div>
  );
}
