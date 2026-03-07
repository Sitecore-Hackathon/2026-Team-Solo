"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { callPersonalize } from "./personalizeClient";
import { resolveContent } from "./contentResolver";
import { usePersonalizeContext } from "./PersonalizeProvider";
import type { ComponentFields, PersonalizeConnectConfig } from "./types";

export interface UsePersonalizeExperienceResult {
  contentKey: string | null;
  resolvedFields: ComponentFields | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook alternative for cases where the HOC pattern doesn't fit.
 * Returns contentKey, resolvedFields, isLoading, and error.
 */
export function usePersonalizeExperience(
  config: PersonalizeConnectConfig | undefined
): UsePersonalizeExperienceResult {
  const context = usePersonalizeContext();
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [resolvedFields, setResolvedFields] = useState<ComponentFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const runPersonalization = useCallback(async () => {
    if (!config || !context) {
      setIsLoading(false);
      return;
    }

    setError(null);
    setContentKey(null);
    setResolvedFields(null);
    setIsLoading(true);

    try {
      const key = await callPersonalize({ config, context });
      if (!mountedRef.current) return;
      setContentKey(key);

      const resolved = await resolveContent({
        contentKey: key,
        config,
        resolveDatasource: context.resolveDatasource,
      });
      if (!mountedRef.current) return;
      if (resolved) setResolvedFields(resolved.fields);
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [config, context]);

  useEffect(() => {
    mountedRef.current = true;
    runPersonalization();
    return () => {
      mountedRef.current = false;
    };
  }, [runPersonalization]);

  return {
    contentKey,
    resolvedFields,
    isLoading,
    error,
  };
}
