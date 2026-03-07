import type { ReactNode } from "react";

/**
 * Personalize Connect SDK types.
 * Stored on the rendering in XMC layout data.
 */
export interface PersonalizeConnectConfig {
  /** The Personalize Interactive Experience friendly ID */
  friendlyId: string;

  /**
   * Maps contentKey values (returned by the experience)
   * to XMC datasource item GUIDs
   */
  contentMap: Record<string, string>;

  /**
   * Which contentMap key to render on initial load
   * and use as fallback if the experience fails
   * or returns an unrecognized key
   */
  defaultKey: string;
}

/** The standardized API response contract from Personalize */
export interface PersonalizeConnectResponse {
  contentKey: string;
}

/** What the SDK sends to Personalize /v2/callFlows */
export interface CallFlowsRequest {
  clientKey: string;
  channel: string;
  language: string;
  currencyCode: string;
  pointOfSale: string;
  browserId: string;
  friendlyId: string;
  params?: {
    componentRef?: string;
    pageRoute?: string;
    [key: string]: unknown;
  };
}

/** Provider configuration */
export interface PersonalizeConnectProviderProps {
  clientKey: string;
  pointOfSale: string;
  channel?: string;
  language?: string;
  currencyCode?: string;
  timeout?: number;
  /** Custom function to fetch datasource fields by item ID. When omitted and edgeUrl + apiKey are set, the SDK resolves via Experience Edge. */
  resolveDatasource?: (datasourceId: string) => Promise<ComponentFields>;
  /** Experience Edge GraphQL endpoint (e.g. GRAPH_QL_ENDPOINT). Enables built-in datasource resolution when resolveDatasource is not provided. */
  edgeUrl?: string;
  /** Sitecore API key for Experience Edge (e.g. SITECORE_API_KEY). Required alongside edgeUrl for built-in resolution. */
  apiKey?: string;
  /** Override editing mode detection. When true the HOC renders a visual indicator. When omitted the SDK auto-detects Page Builder / Experience Editor. */
  isEditing?: boolean;
  children: ReactNode;
}

/** Resolved datasource fields passed as component props */
export type ComponentFields = Record<string, unknown>;

/** Value exposed by PersonalizeContext */
export interface PersonalizeContextValue {
  clientKey: string;
  pointOfSale: string;
  channel: string;
  language: string;
  currencyCode: string;
  timeout: number;
  browserId: string;
  resolveDatasource: (datasourceId: string) => Promise<ComponentFields>;
  isEditing: boolean;
}
