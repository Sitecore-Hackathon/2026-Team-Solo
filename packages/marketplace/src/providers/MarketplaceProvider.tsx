"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { ApplicationContext, PagesContext } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";

export interface MarketplaceContextValue {
  client: ClientSDK | null;
  appContext: ApplicationContext | null;
  pagesContext: PagesContext | null;
  error: string | null;
  loading: boolean;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

let cachedClient: ClientSDK | undefined;

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientSDK | null>(null);
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const [pagesContext, setPagesContext] = useState<PagesContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (!cachedClient) {
          cachedClient = await ClientSDK.init({
            target: window.parent,
            modules: [XMC],
          });
        }
        if (cancelled) return;
        setClient(cachedClient);

        const appCtx = await cachedClient.query("application.context");
        if (cancelled) return;
        setAppContext(appCtx.data as ApplicationContext);

        cachedClient.query("pages.context", {
          subscribe: true,
          onSuccess: (res) => {
            if (!cancelled) setPagesContext(res as PagesContext);
          },
        });

        try {
          const frames = window.parent?.frames;
          if (frames) {
            for (let i = 0; i < frames.length; i++) {
              try {
                frames[i].postMessage(
                  { type: "personalize-connect-active" },
                  "*"
                );
              } catch { /* cross-origin — expected for some frames */ }
            }
          }
        } catch { /* cross-origin parent access */ }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: MarketplaceContextValue = {
    client,
    appContext,
    pagesContext,
    error,
    loading,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplaceContext(): MarketplaceContextValue {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error("useMarketplaceContext must be used within MarketplaceProvider");
  }
  return ctx;
}
