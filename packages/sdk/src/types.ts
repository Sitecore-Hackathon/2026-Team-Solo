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

/** What the SDK sends to Personalize /v2/callFlows (legacy direct mode) */
export interface CallFlowsRequest {
  clientKey?: string;
  channel: string;
  language: string;
  currencyCode: string;
  pointOfSale?: string;
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
  // --- Context ID path (XM Cloud Edge proxy) ---
  /** Sitecore Edge Context ID. When provided, all calls route through the Edge proxy. */
  sitecoreEdgeContextId?: string;
  /** Edge platform base URL. Defaults to https://edge-platform.sitecorecloud.io */
  sitecoreEdgeUrl?: string;
  /** XM Cloud site name, used with Context ID for personalize and init calls. */
  siteName?: string;

  // --- Legacy direct path (non-XM Cloud or explicit credentials) ---
  /** Personalize API client key (legacy mode). Not needed when using sitecoreEdgeContextId. */
  clientKey?: string;
  /** Point of sale identifier (legacy mode). Not needed when using sitecoreEdgeContextId. */
  pointOfSale?: string;
  /** Experience Edge GraphQL endpoint for direct access (legacy). Not needed with Context ID. */
  edgeUrl?: string;
  /** Sitecore API key for Experience Edge (legacy). Not needed with Context ID. */
  apiKey?: string;

  // --- Config loading ---
  /** Override for the site root content tree path (e.g. "/sitecore/content/company/company"). Normally auto-discovered from the page item — only needed if auto-discovery fails. */
  sitePath?: string;

  // --- Common ---
  channel?: string;
  language?: string;
  currencyCode?: string;
  timeout?: number;
  /** Custom function to fetch datasource fields by item ID. When omitted the SDK resolves via Edge. */
  resolveDatasource?: (datasourceId: string) => Promise<ComponentFields>;
  /** Override editing mode detection. When true the HOC renders a visual indicator. */
  isEditing?: boolean;
  /** Enable debug logging to the browser console. */
  debug?: boolean;
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
  /** True when operating in Edge Context ID mode */
  useEdgeProxy: boolean;
  /** Edge proxy base URL (only set in Context ID mode) */
  edgeProxyUrl: string;
  /** Context ID (only set in Context ID mode) */
  sitecoreEdgeContextId: string;
  /** Site name (only set in Context ID mode) */
  siteName: string;
  /** Configs loaded from the content tree, keyed by normalized rendering instance ID */
  configs: Map<string, PersonalizeConnectConfig>;
  /** Whether configs have finished loading */
  configsLoaded: boolean;
}
