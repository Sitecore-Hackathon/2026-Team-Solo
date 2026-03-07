/**
 * Personalize Connect SDK
 *
 * A lightweight Next.js package that bridges Sitecore Personalize Interactive Experiences
 * with XM Cloud component datasources at runtime. The SDK reads configuration authored
 * by the Marketplace app, calls Personalize for a decision, and swaps component content
 * accordingly — with zero per-component code.
 */

// Types
export type {
  PersonalizeConnectConfig,
  PersonalizeConnectResponse,
  CallFlowsRequest,
  PersonalizeConnectProviderProps,
  PersonalizeContextValue,
  ComponentFields,
} from "./types";

// Provider & Context
export { PersonalizeProvider, usePersonalizeContext } from "./PersonalizeProvider";

// Client (for advanced use)
export { callPersonalize } from "./personalizeClient";
export type { CallPersonalizeOptions } from "./personalizeClient";

// Content resolver (for advanced use)
export { resolveContent } from "./contentResolver";
export type { ResolveContentOptions, ResolvedContent } from "./contentResolver";

// HOC
export { withPersonalizeConnect } from "./withPersonalizeConnect";
export type { GetConfigFromProps } from "./withPersonalizeConnect";

// Hook
export { usePersonalizeExperience } from "./usePersonalizeExperience";
export type { UsePersonalizeExperienceResult } from "./usePersonalizeExperience";

// Config loader (fetches PersonalizeConnect configs from Edge)
export { loadPageConfigs } from "./configLoader";

// Edge resolver (built-in datasource resolution via Experience Edge)
export { createEdgeResolver, createEdgeProxyResolver } from "./edgeResolver";

// Editing detection
export { isEditingMode, resetEditingDetectionCache } from "./editingDetection";

// Debug logger
export { setDebug, isDebugEnabled } from "./logger";

// Utilities
export { getBrowserId, getEdgeBrowserId, resetEdgeInitCache } from "./browserId";
export type { EdgeInitResponse } from "./browserId";
