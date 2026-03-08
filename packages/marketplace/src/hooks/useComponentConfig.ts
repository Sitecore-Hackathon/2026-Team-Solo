"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import {
  loadConfig,
  loadConfigRenderingIdsForPage,
  saveConfig,
  type PersonalizeConnectConfig,
} from "@/lib/config-store";
import type { PageRendering } from "@/hooks/usePageComponents";
import type { PersonalizeExperienceDetail } from "@/hooks/usePersonalizeExperiences";

interface UseComponentConfigOptions {
  client: ClientSDK;
  sitecoreContextId: string;
  sitePath: string;
  pageId: string;
  components: PageRendering[];
  fetchExperienceDetail: (id: string) => Promise<PersonalizeExperienceDetail | null>;
}

export function useComponentConfig({
  client,
  sitecoreContextId,
  sitePath,
  pageId,
  components,
  fetchExperienceDetail,
}: UseComponentConfigOptions) {
  const [selectedRendering, setSelectedRendering] = useState<PageRendering | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<{
    id: string;
    friendlyId?: string;
    name?: string;
  } | null>(null);
  const [experienceDetail, setExperienceDetail] = useState<PersonalizeExperienceDetail | null>(null);
  const [contentKeys, setContentKeys] = useState<string[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, string>>({});
  const [configMap, setConfigMap] = useState<Record<string, boolean>>({});
  const [existingConfig, setExistingConfig] = useState<PersonalizeConnectConfig | null>(null);
  const [templateValid, setTemplateValid] = useState<boolean | null>(null);
  const [templateValidating, setTemplateValidating] = useState(false);

  useEffect(() => {
    setSelectedRendering(null);
    setSelectedExperience(null);
    setExperienceDetail(null);
    setContentKeys([]);
    setContentMap({});
    setTemplateValid(null);
  }, [pageId]);

  useEffect(() => {
    if (!selectedRendering || !client || !sitecoreContextId || !pageId) {
      setExistingConfig(null);
      if (!selectedRendering) {
        setSelectedExperience(null);
        setExperienceDetail(null);
        setContentKeys([]);
        setContentMap({});
        setTemplateValid(null);
      }
      return;
    }

    let stale = false;
    (async () => {
      const config = await loadConfig(
        client,
        sitecoreContextId,
        sitePath,
        pageId,
        selectedRendering.renderingId
      );
      if (stale) return;
      setExistingConfig(config);
      if (config) {
        setSelectedExperience({
          id: config.experienceId,
          friendlyId: config.friendlyId,
          name: config.friendlyId,
        });
        const map = config.contentMap ?? {};
        const keys = Object.keys(map);
        const defaultKey = config.defaultKey ?? keys[0];
        setContentKeys(defaultKey && keys.includes(defaultKey)
          ? [defaultKey, ...keys.filter((k) => k !== defaultKey)]
          : keys);
        setContentMap(map);
        const detail = await fetchExperienceDetail(config.experienceId);
        if (!stale) {
          setExperienceDetail(detail);
          validateTemplates(detail?.templates);
        }
      } else {
        setSelectedExperience(null);
        setContentKeys([]);
        setContentMap({});
        setExperienceDetail(null);
      }
    })();
    return () => {
      stale = true;
    };
  }, [
    selectedRendering?.instanceId,
    client,
    sitecoreContextId,
    pageId,
    sitePath,
    fetchExperienceDetail,
  ]);

  // Pre-load which components have configs (for "Experience Linked" badges)
  useEffect(() => {
    if (!client || !sitecoreContextId || !sitePath || !pageId || components.length === 0) return;
    let stale = false;
    (async () => {
      const renderingIdsWithConfig = await loadConfigRenderingIdsForPage(
        client,
        sitecoreContextId,
        sitePath,
        pageId
      );
      if (stale) return;
      const next: Record<string, boolean> = {};
      for (const c of components) {
        next[c.instanceId] = renderingIdsWithConfig.has(c.renderingId);
      }
      setConfigMap((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      stale = true;
    };
  }, [client, sitecoreContextId, sitePath, pageId, components]);

  useEffect(() => {
    if (!selectedRendering) return;
    setConfigMap((prev) => ({
      ...prev,
      [selectedRendering.instanceId]: !!existingConfig,
    }));
  }, [selectedRendering?.instanceId, existingConfig]);

  const validateTemplates = useCallback(
    (templates?: string[]) => {
      if (!templates || templates.length === 0) {
        setTemplateValid(false);
        return false;
      }
      const valid = templates.some((t) => t.includes("contentKey"));
      setTemplateValid(valid);
      return valid;
    },
    []
  );

  const revalidateExperience = useCallback(async () => {
    if (!selectedExperience) return;
    setTemplateValidating(true);
    try {
      const detail = await fetchExperienceDetail(selectedExperience.id);
      setExperienceDetail(detail);
      validateTemplates(detail?.templates);
    } finally {
      setTemplateValidating(false);
    }
  }, [selectedExperience, fetchExperienceDetail, validateTemplates]);

  const handleExperienceSelect = useCallback(
    async (exp: { id: string; friendlyId?: string; name?: string } | null) => {
      setSelectedExperience(exp);
      setTemplateValid(null);
      if (!exp) {
        setExperienceDetail(null);
        setContentKeys([]);
        setContentMap({});
        return;
      }
      setTemplateValidating(true);
      try {
        const detail = await fetchExperienceDetail(exp.id);
        setExperienceDetail(detail);
        validateTemplates(detail?.templates);
      } finally {
        setTemplateValidating(false);
      }
      setContentKeys([]);
      setContentMap({});
    },
    [fetchExperienceDetail, validateTemplates]
  );

  const handleAddContentKey = useCallback((key: string) => {
    setContentKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const handleRemoveContentKey = useCallback((key: string) => {
    setContentKeys((prev) => prev.filter((k) => k !== key));
    setContentMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleContentMapChange = useCallback((contentKey: string, datasourceId: string) => {
    setContentMap((prev) => {
      const next = { ...prev };
      if (datasourceId) next[contentKey] = datasourceId;
      else delete next[contentKey];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!client || !sitecoreContextId || !pageId || !selectedRendering || !selectedExperience)
      return;

    const filteredContentMap: Record<string, string> = {};
    for (const key of contentKeys) {
      const v = contentMap[key];
      if (v) filteredContentMap[key] = v;
    }

    const friendlyId = selectedExperience.friendlyId ?? selectedExperience.name ?? selectedExperience.id;
    const effectiveDefaultKey = contentKeys[0] ?? "";

    const config: PersonalizeConnectConfig = {
      componentName: selectedRendering.componentName,
      renderingId: selectedRendering.renderingId,
      instanceId: selectedRendering.instanceId,
      experienceId: selectedExperience.id,
      friendlyId,
      contentMap: filteredContentMap,
      defaultKey: effectiveDefaultKey,
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(client, sitecoreContextId, sitePath, pageId, config);
    setExistingConfig(config);
    setConfigMap((prev) => ({ ...prev, [selectedRendering.instanceId]: true }));
  }, [
    client,
    sitecoreContextId,
    pageId,
    sitePath,
    selectedRendering,
    selectedExperience,
    contentKeys,
    contentMap,
  ]);

  return {
    selectedRendering,
    setSelectedRendering,
    selectedExperience,
    experienceDetail,
    contentKeys,
    contentMap,
    configMap,
    existingConfig,
    templateValid,
    templateValidating,
    revalidateExperience,
    handleExperienceSelect,
    handleAddContentKey,
    handleRemoveContentKey,
    handleContentMapChange,
    handleSave,
  };
}
