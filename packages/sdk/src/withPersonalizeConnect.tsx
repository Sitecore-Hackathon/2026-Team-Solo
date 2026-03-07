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
 * If the rendering has a personalizeConnect config, it renders with defaultKey first,
 * then asynchronously fetches the personalized content and re-renders.
 * If no config, passes through unchanged.
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
    const config = getConfig(props);
    const [resolvedFields, setResolvedFields] = useState<ComponentFields | null>(null);
    const mountedRef = useRef(true);

    if (!config) {
      log(`[${componentName}] No personalizeConnect config on rendering — passthrough`);
    } else {
      log(`[${componentName}] Config found:`, { friendlyId: config.friendlyId, defaultKey: config.defaultKey, keys: Object.keys(config.contentMap) });
    }

    if (!context) {
      warn(`[${componentName}] PersonalizeContext is null — is PersonalizeProvider mounted?`);
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
        log(`[${componentName}] Fields resolved — swapping props.fields`, { datasourceId: resolved.datasourceId, fieldNames: Object.keys(resolved.fields) });
        setResolvedFields(resolved.fields);
      } else {
        warn(`[${componentName}] Content resolution returned null — component keeps original fields`);
      }
      groupEnd();
    }, [config, context]);

    useEffect(() => {
      mountedRef.current = true;
      if (config && context) {
        runPersonalization();
      }
      return () => {
        mountedRef.current = false;
      };
    }, [config?.friendlyId, context?.clientKey, runPersonalization]);

    if (!config || !context) {
      return <WrappedComponent {...props} />;
    }

    const mergedProps = resolvedFields
      ? ({ ...props, fields: resolvedFields } as P)
      : props;

    const component = <WrappedComponent {...mergedProps} />;

    if (context.isEditing) {
      log(`[${componentName}] Editing mode — rendering indicator badge`);
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
