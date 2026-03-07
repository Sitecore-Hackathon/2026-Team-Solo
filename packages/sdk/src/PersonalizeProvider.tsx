"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserId, getEdgeBrowserId } from "./browserId";
import { createEdgeResolver, createEdgeProxyResolver } from "./edgeResolver";
import { isEditingMode } from "./editingDetection";
import type { ComponentFields, PersonalizeConnectProviderProps, PersonalizeContextValue } from "./types";

const PersonalizeContext = createContext<PersonalizeContextValue | null>(null);

const DEFAULT_CHANNEL = "WEB";
const DEFAULT_LANGUAGE = "EN";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TIMEOUT = 600;
const DEFAULT_EDGE_URL = "https://edge-platform.sitecorecloud.io";

const noopResolver: (id: string) => Promise<ComponentFields> = async () => ({});

export function PersonalizeProvider({
  children,
  // Context ID mode
  sitecoreEdgeContextId,
  sitecoreEdgeUrl = DEFAULT_EDGE_URL,
  siteName = "",
  // Legacy mode
  clientKey = "",
  pointOfSale = "",
  edgeUrl,
  apiKey,
  // Common
  channel = DEFAULT_CHANNEL,
  language = DEFAULT_LANGUAGE,
  currencyCode = DEFAULT_CURRENCY,
  timeout = DEFAULT_TIMEOUT,
  resolveDatasource,
  isEditing: isEditingProp,
}: PersonalizeConnectProviderProps) {
  const useEdgeProxy = Boolean(sitecoreEdgeContextId);
  const [browserId, setBrowserId] = useState<string>("");
  const [detectedEditing, setDetectedEditing] = useState(false);

  useEffect(() => {
    if (useEdgeProxy) {
      getEdgeBrowserId(sitecoreEdgeUrl, sitecoreEdgeContextId!, siteName).then(setBrowserId);
    } else if (clientKey) {
      setBrowserId(getBrowserId(clientKey));
    }
  }, [useEdgeProxy, sitecoreEdgeContextId, sitecoreEdgeUrl, siteName, clientKey]);

  useEffect(() => {
    if (isEditingProp === undefined) {
      setDetectedEditing(isEditingMode());
    }
  }, [isEditingProp]);

  const effectiveEditing = isEditingProp ?? detectedEditing;

  const effectiveResolver = useCallback(
    resolveDatasource ??
      (useEdgeProxy
        ? createEdgeProxyResolver(sitecoreEdgeUrl, sitecoreEdgeContextId!, language)
        : edgeUrl && apiKey
          ? createEdgeResolver(edgeUrl, apiKey, language)
          : noopResolver),
    [resolveDatasource, useEdgeProxy, sitecoreEdgeUrl, sitecoreEdgeContextId, edgeUrl, apiKey, language]
  );

  const effectiveBrowserId =
    browserId ||
    (!useEdgeProxy && clientKey && typeof window !== "undefined" ? getBrowserId(clientKey) : "");

  const value: PersonalizeContextValue = useMemo(
    () => ({
      clientKey,
      pointOfSale,
      channel,
      language,
      currencyCode,
      timeout,
      browserId: effectiveBrowserId,
      resolveDatasource: effectiveResolver,
      isEditing: effectiveEditing,
      useEdgeProxy,
      edgeProxyUrl: useEdgeProxy ? sitecoreEdgeUrl : "",
      sitecoreEdgeContextId: sitecoreEdgeContextId ?? "",
      siteName,
    }),
    [
      clientKey,
      pointOfSale,
      channel,
      language,
      currencyCode,
      timeout,
      effectiveBrowserId,
      effectiveResolver,
      effectiveEditing,
      useEdgeProxy,
      sitecoreEdgeUrl,
      sitecoreEdgeContextId,
      siteName,
    ]
  );

  return (
    <PersonalizeContext.Provider value={value}>{children}</PersonalizeContext.Provider>
  );
}

export function usePersonalizeContext(): PersonalizeContextValue | null {
  return useContext(PersonalizeContext);
}
