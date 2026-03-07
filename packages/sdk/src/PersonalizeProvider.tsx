"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserId, getEdgeBrowserId } from "./browserId";
import { createEdgeResolver, createEdgeProxyResolver } from "./edgeResolver";
import { isEditingMode } from "./editingDetection";
import { setDebug, log, warn } from "./logger";
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
  sitecoreEdgeContextId,
  sitecoreEdgeUrl = DEFAULT_EDGE_URL,
  siteName = "",
  clientKey = "",
  pointOfSale = "",
  edgeUrl,
  apiKey,
  channel = DEFAULT_CHANNEL,
  language = DEFAULT_LANGUAGE,
  currencyCode = DEFAULT_CURRENCY,
  timeout = DEFAULT_TIMEOUT,
  resolveDatasource,
  isEditing: isEditingProp,
  debug = false,
}: PersonalizeConnectProviderProps) {
  const useEdgeProxy = Boolean(sitecoreEdgeContextId);
  const [browserId, setBrowserId] = useState<string>("");
  const [detectedEditing, setDetectedEditing] = useState(false);

  useEffect(() => {
    setDebug(debug);
  }, [debug]);

  useEffect(() => {
    setDebug(debug);
    log("Provider mounting", {
      mode: useEdgeProxy ? "Context ID" : "Legacy",
      sitecoreEdgeContextId: sitecoreEdgeContextId ?? "(none)",
      sitecoreEdgeUrl,
      siteName: siteName || "(none)",
      clientKey: clientKey ? `${clientKey.slice(0, 8)}...` : "(none)",
      pointOfSale: pointOfSale || "(none)",
      edgeUrl: edgeUrl ?? "(none)",
      apiKey: apiKey ? `${apiKey.slice(0, 8)}...` : "(none)",
      language,
      channel,
      hasCustomResolver: Boolean(resolveDatasource),
      isEditingProp: isEditingProp ?? "auto-detect",
    });
  }, []);

  useEffect(() => {
    if (useEdgeProxy) {
      log("BrowserId: fetching via Edge init", { sitecoreEdgeUrl, sitecoreEdgeContextId, siteName });
      getEdgeBrowserId(sitecoreEdgeUrl, sitecoreEdgeContextId!, siteName)
        .then((bid) => {
          log("BrowserId: resolved via Edge init", bid);
          setBrowserId(bid);
        })
        .catch((err) => {
          warn("BrowserId: Edge init failed, will use fallback", err);
        });
    } else if (clientKey) {
      const bid = getBrowserId(clientKey);
      log("BrowserId: resolved via local cookie", bid);
      setBrowserId(bid);
    } else {
      warn("BrowserId: no clientKey and no sitecoreEdgeContextId — browserId will be empty");
    }
  }, [useEdgeProxy, sitecoreEdgeContextId, sitecoreEdgeUrl, siteName, clientKey]);

  useEffect(() => {
    if (isEditingProp === undefined) {
      const detected = isEditingMode();
      log("Editing mode auto-detected:", detected);
      setDetectedEditing(detected);
    } else {
      log("Editing mode overridden via prop:", isEditingProp);
    }
  }, [isEditingProp]);

  const effectiveEditing = isEditingProp ?? detectedEditing;

  const effectiveResolver = useCallback(() => {
    if (resolveDatasource) {
      log("Resolver: using custom resolveDatasource callback");
      return resolveDatasource;
    }
    if (useEdgeProxy) {
      log("Resolver: using Edge proxy GraphQL", { sitecoreEdgeUrl, sitecoreEdgeContextId });
      return createEdgeProxyResolver(sitecoreEdgeUrl, sitecoreEdgeContextId!, language);
    }
    if (edgeUrl && apiKey) {
      log("Resolver: using direct Edge GraphQL", { edgeUrl });
      return createEdgeResolver(edgeUrl, apiKey, language);
    }
    warn("Resolver: no resolver configured — resolveDatasource will return {}. Provide sitecoreEdgeContextId, edgeUrl+apiKey, or a custom resolveDatasource.");
    return noopResolver;
  }, [resolveDatasource, useEdgeProxy, sitecoreEdgeUrl, sitecoreEdgeContextId, edgeUrl, apiKey, language])();

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
