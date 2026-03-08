"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserId, getEdgeBrowserId } from "./browserId";
import { createEdgeResolver, createEdgeProxyResolver } from "./edgeResolver";
import { isEditingMode } from "./editingDetection";
import { loadPageConfigs } from "./configLoader";
import { setDebug, log, warn } from "./logger";
import type {
  ComponentFields,
  PersonalizeConnectConfig,
  PersonalizeConnectProviderProps,
  PersonalizeContextValue,
} from "./types";

const PersonalizeContext = createContext<PersonalizeContextValue | null>(null);

const DEFAULT_CHANNEL = "WEB";
const DEFAULT_LANGUAGE = "EN";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TIMEOUT = 600;
const DEFAULT_EDGE_URL = "https://edge-platform.sitecorecloud.io";

const noopResolver: (id: string) => Promise<ComponentFields> = async () => ({});
const EMPTY_CONFIGS = new Map<string, PersonalizeConnectConfig>();

function getPageItemIdFromNextData(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const nd = (window as unknown as Record<string, unknown>).__NEXT_DATA__ as {
      props?: {
        pageProps?: {
          layoutData?: {
            sitecore?: {
              route?: { itemId?: string };
            };
          };
        };
      };
    } | undefined;
    return nd?.props?.pageProps?.layoutData?.sitecore?.route?.itemId ?? null;
  } catch {
    return null;
  }
}

export function PersonalizeProvider({
  children,
  sitecoreEdgeContextId,
  sitecoreEdgeUrl = DEFAULT_EDGE_URL,
  siteName = "",
  sitePath,
  // Legacy 4-key path — TODO: remove when cleaning legacy (Context ID is primary)
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
  const [configs, setConfigs] = useState<Map<string, PersonalizeConnectConfig>>(EMPTY_CONFIGS);
  const [configsLoaded, setConfigsLoaded] = useState(false);

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
      sitePath: sitePath ?? "(none — configs will not be loaded from Edge)",
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

  // --- BrowserId ---
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

  // --- Editing detection ---
  useEffect(() => {
    if (isEditingProp === undefined) {
      const detected = isEditingMode();
      log("Editing mode auto-detected:", detected);
      setDetectedEditing(detected);
    } else {
      log("Editing mode overridden via prop:", isEditingProp);
    }
  }, [isEditingProp]);

  // --- Config loading ---
  useEffect(() => {
    const pageItemId = getPageItemIdFromNextData();
    if (!pageItemId) {
      warn("Config loader: could not read page item ID from __NEXT_DATA__.sitecore.route.itemId — cannot load configs");
      setConfigsLoaded(true);
      return;
    }

    let graphqlUrl: string;
    let headers: Record<string, string> = {};

    if (useEdgeProxy) {
      const base = sitecoreEdgeUrl.replace(/\/$/, "");
      graphqlUrl = `${base}/v1/content/api/graphql/v1?sitecoreContextId=${encodeURIComponent(sitecoreEdgeContextId!)}`;
    } else if (edgeUrl && apiKey) {
      graphqlUrl = edgeUrl;
      headers = { sc_apikey: apiKey };
    } else {
      warn("Config loader: no Edge endpoint available — cannot load configs");
      setConfigsLoaded(true);
      return;
    }

    log("Config loader: starting", { pageItemId, sitePathOverride: sitePath ?? "(auto-discover)" });

    loadPageConfigs(graphqlUrl, pageItemId, language, headers, sitePath)
      .then((loaded) => {
        log("Config loader: complete,", loaded.size, "configs loaded");
        setConfigs(loaded);
        setConfigsLoaded(true);
      })
      .catch((err) => {
        warn("Config loader: failed", err);
        setConfigsLoaded(true);
      });
  }, [sitePath, useEdgeProxy, sitecoreEdgeContextId, sitecoreEdgeUrl, edgeUrl, apiKey, language]);

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
    warn("Resolver: no resolver configured — resolveDatasource will return {}.");
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
      configs,
      configsLoaded,
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
      configs,
      configsLoaded,
    ]
  );

  return (
    <PersonalizeContext.Provider value={value}>{children}</PersonalizeContext.Provider>
  );
}

export function usePersonalizeContext(): PersonalizeContextValue | null {
  return useContext(PersonalizeContext);
}
