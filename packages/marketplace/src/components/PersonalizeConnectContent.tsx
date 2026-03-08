"use client";

import { useEffect, useMemo } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
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
    templateValid,
    templateValidating,
    revalidateExperience,
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

  const canSave = !!(selectedRendering && selectedExperience && templateValid === true);

  return (
    <div className="flex flex-col p-5">
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

      {selectedExperience && templateValid === false && !templateValidating && (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1 text-sm text-destructive">
            <p className="font-medium">Invalid API response template</p>
            <p className="mt-0.5 text-xs opacity-80">
              Your experience must return a JSON object with a{" "}
              <code className="rounded bg-destructive/10 px-1 py-0.5 font-mono text-[11px]">contentKey</code>{" "}
              property matching the keys you defined above. Update the API
              Response template in Sitecore Personalize and re-verify.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-1.5 h-8 px-3 text-xs"
            onClick={revalidateExperience}
          >
            <RefreshCw className="h-3 w-3" />
            Re-verify
          </Button>
        </div>
      )}

      {selectedExperience && templateValid === true && !templateValidating && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="flex-1 text-sm text-green-700 dark:text-green-300">
            Experience API response contains{" "}
            <code className="rounded bg-green-100 px-1 py-0.5 font-mono text-[11px] dark:bg-green-900/40">contentKey</code>.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 gap-1.5 h-8 px-3 text-xs text-green-600 hover:text-green-700 dark:text-green-400"
            onClick={revalidateExperience}
          >
            <RefreshCw className="h-3 w-3" />
            Re-verify
          </Button>
        </div>
      )}

      {selectedExperience && templateValidating && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-border bg-muted/50 p-3">
          <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
          <p className="flex-1 text-sm text-muted-foreground">
            Verifying experience API response template…
          </p>
        </div>
      )}

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
