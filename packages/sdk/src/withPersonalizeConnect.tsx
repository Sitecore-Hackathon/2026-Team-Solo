"use client";

import type { ComponentType, CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { callPersonalize } from "./personalizeClient";
import { resolveContent } from "./contentResolver";
import { usePersonalizeContext } from "./PersonalizeProvider";
import { log, warn, group, groupEnd } from "./logger";
import type { ComponentFields, PersonalizeConnectConfig } from "./types";

export type GetConfigFromProps<P> = (props: P) => PersonalizeConnectConfig | undefined;

const DEFAULT_GET_CONFIG: GetConfigFromProps<{ rendering?: { personalizeConnect?: PersonalizeConnectConfig } }> = (
  props
) => (props as { rendering?: { personalizeConnect?: PersonalizeConnectConfig } }).rendering?.personalizeConnect;

function normalizeGuid(id: string): string {
  return id.replace(/[{}]/g, "").toLowerCase();
}

function getRenderingUid(props: Record<string, unknown>): string | undefined {
  const rendering = props.rendering as { uid?: string } | undefined;
  return rendering?.uid;
}

const INDICATOR_BORDER: CSSProperties = {
  position: "relative",
  border: "2px dashed #6B5CE7",
  borderRadius: "4px",
};

const INDICATOR_BADGE: CSSProperties = {
  position: "absolute",
  top: "-10px",
  right: "-10px",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "16px",
  color: "#fff",
  backgroundColor: "#6B5CE7",
  borderRadius: "10px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

/**
 * HOC that wraps any JSS component.
 * Looks for config in this order:
 *   1. props.rendering.personalizeConnect (inline on layout data)
 *   2. context.configs map (loaded from content tree via Edge)
 *
 * If config is found, renders with defaultKey first, calls Personalize
 * asynchronously, and re-renders with personalized content.
 *
 * In Page Builder, renders a visual indicator (border + badge) on
 * components that have personalization configured.
 */
export function withPersonalizeConnect<P extends object>(
  WrappedComponent: ComponentType<P>,
  getConfig: GetConfigFromProps<P> = DEFAULT_GET_CONFIG as GetConfigFromProps<P>
): ComponentType<P> {
  const componentName = WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

  function PersonalizeConnectWrapper(props: P) {
    const context = usePersonalizeContext();
    const [resolvedFields, setResolvedFields] = useState<ComponentFields | null>(null);
    const mountedRef = useRef(true);

    // 1. Try inline config from props
    let config = getConfig(props);

    // 2. Fall back to configs loaded from Edge (keyed by rendering uid)
    if (!config && context) {
      const uid = getRenderingUid(props as unknown as Record<string, unknown>);
      if (uid) {
        const normalizedUid = normalizeGuid(uid);
        const fromContext = context.configs.get(normalizedUid);
        if (fromContext) {
          log(`[${componentName}] Config found in context for rendering uid ${normalizedUid}:`, {
            friendlyId: fromContext.friendlyId,
            defaultKey: fromContext.defaultKey,
            keys: Object.keys(fromContext.contentMap),
          });
          config = fromContext;
        } else if (context.configsLoaded) {
          log(`[${componentName}] No config match for uid "${normalizedUid}". All configs:`, Object.fromEntries(context.configs));
        } else {
          log(`[${componentName}] Configs still loading for uid ${normalizedUid}...`);
        }
      } else {
        log(`[${componentName}] No rendering uid on props — cannot look up config from context`);
      }
    }

    if (!config && !context) {
      warn(`[${componentName}] PersonalizeContext is null — is PersonalizeProvider mounted?`);
    }

    if (config) {
      log(`[${componentName}] Config active:`, { friendlyId: config.friendlyId, defaultKey: config.defaultKey, keys: Object.keys(config.contentMap) });
    }

    const runPersonalization = useCallback(async () => {
      if (!config || !context) return;

      group(`[${componentName}] personalization flow`);
      log("Calling Personalize for experience:", config.friendlyId);

      const contentKey = await callPersonalize({ config, context });
      if (!mountedRef.current) { groupEnd(); return; }

      log("Resolving content for contentKey:", contentKey ?? "(null)");
      const resolved = await resolveContent({
        contentKey,
        config,
        resolveDatasource: context.resolveDatasource,
      });
      if (!mountedRef.current) { groupEnd(); return; }

      if (resolved) {
        log(`[${componentName}] Fields resolved — swapping props.fields`, {
          datasourceId: resolved.datasourceId,
          fieldNames: Object.keys(resolved.fields),
        });
        setResolvedFields(resolved.fields);
      } else {
        warn(`[${componentName}] Content resolution returned null — component keeps original fields`);
      }
      groupEnd();
    }, [config, context]);

    useEffect(() => {
      mountedRef.current = true;
      if (config && context && context.browserId) {
        runPersonalization();
      }
      return () => {
        mountedRef.current = false;
      };
    }, [config?.friendlyId, context?.browserId, context?.configsLoaded, runPersonalization]);

    if (!config || !context) {
      return <WrappedComponent {...props} />;
    }

    const mergedProps = resolvedFields
      ? ({ ...props, fields: resolvedFields } as P)
      : props;

    const component = <WrappedComponent {...mergedProps} />;

    if (context.isEditing) {
      log(`[${componentName}] Editing mode — rendering indicator badge for ${config.friendlyId}`);
      return (
        <div style={INDICATOR_BORDER} data-personalize-connect={config.friendlyId}>
          <span style={INDICATOR_BADGE} title={`Personalize: ${config.friendlyId}`}>
            ⚡ Personalized
          </span>
          {component}
        </div>
      );
    }

    return component;
  }

  PersonalizeConnectWrapper.displayName = `WithPersonalizeConnect(${componentName})`;

  return PersonalizeConnectWrapper;
}
