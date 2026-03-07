"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserId } from "./browserId";
import type { ComponentFields, PersonalizeConnectProviderProps, PersonalizeContextValue } from "./types";

const PersonalizeContext = createContext<PersonalizeContextValue | null>(null);

const DEFAULT_CHANNEL = "WEB";
const DEFAULT_LANGUAGE = "EN";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TIMEOUT = 600;

const noopResolver: (id: string) => Promise<ComponentFields> = async () => ({});

export function PersonalizeProvider({
  children,
  clientKey,
  pointOfSale,
  channel = DEFAULT_CHANNEL,
  language = DEFAULT_LANGUAGE,
  currencyCode = DEFAULT_CURRENCY,
  timeout = DEFAULT_TIMEOUT,
  resolveDatasource = noopResolver,
}: PersonalizeConnectProviderProps) {
  const [browserId, setBrowserId] = useState<string>("");

  useEffect(() => {
    setBrowserId(getBrowserId(clientKey));
  }, [clientKey]);

  const stableResolveDatasource = useCallback(resolveDatasource, [resolveDatasource]);

  const effectiveBrowserId = browserId || (typeof window !== "undefined" ? getBrowserId(clientKey) : "");

  const value: PersonalizeContextValue = useMemo(
    () => ({
      clientKey,
      pointOfSale,
      channel,
      language,
      currencyCode,
      timeout,
      browserId: effectiveBrowserId,
      resolveDatasource: stableResolveDatasource,
    }),
    [
      clientKey,
      pointOfSale,
      channel,
      language,
      currencyCode,
      timeout,
      effectiveBrowserId,
      stableResolveDatasource,
    ]
  );

  return (
    <PersonalizeContext.Provider value={value}>{children}</PersonalizeContext.Provider>
  );
}

export function usePersonalizeContext(): PersonalizeContextValue | null {
  return useContext(PersonalizeContext);
}
