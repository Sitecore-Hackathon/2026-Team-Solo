"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { loadConfig, saveConfig, type PersonalizeConnectConfig } from "@/lib/config-store";
import type { PageRendering } from "@/hooks/usePageComponents";
import type { PersonalizeExperienceDetail } from "@/hooks/usePersonalizeExperiences";

interface UseComponentConfigOptions {
  client: ClientSDK;
  sitecoreContextId: string;
  sitePath: string;
  pageId: string;
  fetchExperienceDetail: (id: string) => Promise<PersonalizeExperienceDetail | null>;
}

export function useComponentConfig({
  client,
  sitecoreContextId,
  sitePath,
  pageId,
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

  useEffect(() => {
    setSelectedRendering(null);
    setSelectedExperience(null);
    setExperienceDetail(null);
    setContentKeys([]);
    setContentMap({});
  }, [pageId]);

  useEffect(() => {
    if (!selectedRendering || !client || !sitecoreContextId || !pageId) {
      setExistingConfig(null);
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
        if (!stale) setExperienceDetail(detail);
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

  useEffect(() => {
    if (!selectedRendering) return;
    setConfigMap((prev) => ({
      ...prev,
      [selectedRendering.instanceId]: !!existingConfig,
    }));
  }, [selectedRendering?.instanceId, existingConfig]);

  const handleExperienceSelect = useCallback(
    async (exp: { id: string; friendlyId?: string; name?: string } | null) => {
      setSelectedExperience(exp);
      if (!exp) {
        setExperienceDetail(null);
        setContentKeys([]);
        setContentMap({});
        return;
      }
      const detail = await fetchExperienceDetail(exp.id);
      setExperienceDetail(detail);
      setContentKeys([]);
      setContentMap({});
    },
    [fetchExperienceDetail]
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
    handleExperienceSelect,
    handleAddContentKey,
    handleRemoveContentKey,
    handleContentMapChange,
    handleSave,
  };
}
