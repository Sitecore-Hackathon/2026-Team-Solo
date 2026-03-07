import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface UseMarketplaceClientOptions {
  retryAttempts?: number;
  retryDelay?: number;
  autoInit?: boolean;
}

const DEFAULT_OPTIONS: Required<UseMarketplaceClientOptions> = {
  retryAttempts: 3,
  retryDelay: 1000,
  autoInit: true,
};

let clientInstance: ClientSDK | undefined;
let initPromise: Promise<ClientSDK> | undefined;

async function getMarketplaceClient(): Promise<ClientSDK> {
  if (clientInstance) return clientInstance;

  if (initPromise) return initPromise;

  console.log("[PersonalizeConnect] Starting ClientSDK.init…");

  const config = {
    target: window.parent,
    modules: [XMC],
  };

  initPromise = ClientSDK.init(config).then((sdk) => {
    console.log("[PersonalizeConnect] ClientSDK.init resolved");
    clientInstance = sdk;
    return sdk;
  });

  return initPromise;
}

export function useMarketplaceClient(options: UseMarketplaceClientOptions = {}) {
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options.retryAttempts, options.retryDelay, options.autoInit]
  );

  const [state, setState] = useState<MarketplaceClientState>({
    client: null,
    error: null,
    isLoading: false,
    isInitialized: false,
  });
  const isInitializingRef = useRef(false);

  const initializeClient = useCallback(
    async (attempt = 1): Promise<void> => {
      let shouldProceed = false;
      setState((prev) => {
        if (prev.isLoading || prev.isInitialized || isInitializingRef.current) {
          return prev;
        }
        shouldProceed = true;
        isInitializingRef.current = true;
        return { ...prev, isLoading: true, error: null };
      });

      if (!shouldProceed) return;

      try {
        const client = await getMarketplaceClient();
        setState({
          client,
          error: null,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error) {
        if (attempt < opts.retryAttempts) {
          await new Promise((r) => setTimeout(r, opts.retryDelay));
          return initializeClient(attempt + 1);
        }
        setState({
          client: null,
          error: error instanceof Error ? error : new Error("Failed to initialize MarketplaceClient"),
          isLoading: false,
          isInitialized: false,
        });
      } finally {
        isInitializingRef.current = false;
      }
    },
    [opts.retryAttempts, opts.retryDelay]
  );

  useEffect(() => {
    if (opts.autoInit) {
      initializeClient();
    }
    return () => {
      isInitializingRef.current = false;
    };
  }, [opts.autoInit, initializeClient]);

  return useMemo(
    () => ({
      ...state,
      initialize: initializeClient,
    }),
    [state, initializeClient]
  );
}
