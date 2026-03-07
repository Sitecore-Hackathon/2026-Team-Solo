"use client";

import type { ComponentType, CSSProperties } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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

const BAR_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  background: "linear-gradient(135deg, #6B5CE7 0%, #8B7CF7 100%)",
  color: "#fff",
  fontSize: "12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontWeight: 500,
  borderRadius: "6px 6px 0 0",
  zIndex: 9999,
  flexWrap: "wrap",
};

const LABEL_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginRight: "6px",
  fontSize: "11px",
  opacity: 0.85,
  whiteSpace: "nowrap",
};

const TAB_BASE: CSSProperties = {
  padding: "3px 10px",
  fontSize: "11px",
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  lineHeight: "16px",
};

const TAB_ACTIVE: CSSProperties = {
  ...TAB_BASE,
  background: "#fff",
  color: "#6B5CE7",
  border: "1px solid #fff",
};

const TAB_INACTIVE: CSSProperties = {
  ...TAB_BASE,
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
};

const LOADING_STYLE: CSSProperties = {
  marginLeft: "auto",
  fontSize: "10px",
  opacity: 0.7,
};

function PreviewBar({
  config,
  activeKey,
  isLoading,
  onSelect,
}: {
  config: PersonalizeConnectConfig;
  activeKey: string | null;
  isLoading: boolean;
  onSelect: (key: string | null) => void;
}) {
  const keys = Object.keys(config.contentMap);

  return (
    <div style={BAR_STYLE} data-personalize-connect-bar={config.friendlyId}>
      <span style={LABEL_STYLE}>
        ⚡ {config.friendlyId}
      </span>
      <button
        type="button"
        style={activeKey === null ? TAB_ACTIVE : TAB_INACTIVE}
        onClick={() => onSelect(null)}
      >
        Original
      </button>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          style={activeKey === key ? TAB_ACTIVE : TAB_INACTIVE}
          onClick={() => onSelect(key)}
        >
          {key}
        </button>
      ))}
      {isLoading && <span style={LOADING_STYLE}>loading...</span>}
    </div>
  );
}

/**
 * HOC that wraps any JSS component.
 *
 * Config lookup order:
 *   1. props.rendering.personalizeConnect (inline on layout data)
 *   2. context.configs map (loaded from content tree via Edge)
 *
 * Live site: renders with defaultKey first, calls Personalize async, re-renders.
 * Page Builder: shows a preview bar above the component to switch between
 * content variants without running actual personalization.
 */
export function withPersonalizeConnect<P extends object>(
  WrappedComponent: ComponentType<P>,
  getConfig: GetConfigFromProps<P> = DEFAULT_GET_CONFIG as GetConfigFromProps<P>
): ComponentType<P> {
  const componentName = WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

  function PersonalizeConnectWrapper(props: P) {
    const context = usePersonalizeContext();
    const [resolvedFields, setResolvedFields] = useState<ComponentFields | null>(null);
    const [previewKey, setPreviewKey] = useState<string | null>(null);
    const [previewFields, setPreviewFields] = useState<ComponentFields | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const mountedRef = useRef(true);
    const previewCacheRef = useRef<Map<string, ComponentFields>>(new Map());

    let config = getConfig(props);

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

    const isEditing = context?.isEditing ?? false;

    const handlePreviewSelect = useCallback(async (key: string | null) => {
      if (!config || !context) return;

      setPreviewKey(key);

      if (key === null) {
        setPreviewFields(null);
        return;
      }

      const cached = previewCacheRef.current.get(key);
      if (cached) {
        setPreviewFields(cached);
        return;
      }

      const datasourceId = config.contentMap[key];
      if (!datasourceId) {
        warn(`[${componentName}] Preview: no datasource for key "${key}"`);
        setPreviewFields(null);
        return;
      }

      setPreviewLoading(true);
      log(`[${componentName}] Preview: resolving datasource for key "${key}" →`, datasourceId);

      try {
        const fields = await context.resolveDatasource(datasourceId);
        if (mountedRef.current) {
          previewCacheRef.current.set(key, fields);
          setPreviewFields(fields);
          log(`[${componentName}] Preview: resolved fields for "${key}":`, Object.keys(fields));
        }
      } catch (e) {
        warn(`[${componentName}] Preview: failed to resolve datasource for "${key}"`, e);
        if (mountedRef.current) setPreviewFields(null);
      } finally {
        if (mountedRef.current) setPreviewLoading(false);
      }
    }, [config, context]);

    const runPersonalization = useCallback(async () => {
      if (!config || !context || isEditing) return;

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
    }, [config, context, isEditing]);

    useEffect(() => {
      mountedRef.current = true;
      if (config && context && context.browserId && !isEditing) {
        runPersonalization();
      }
      return () => {
        mountedRef.current = false;
      };
    }, [config?.friendlyId, context?.browserId, context?.configsLoaded, isEditing, runPersonalization]);

    if (!config || !context) {
      return <WrappedComponent {...props} />;
    }

    if (isEditing) {
      const editingFields = previewKey !== null ? previewFields : null;
      const editingProps = editingFields
        ? ({ ...props, fields: editingFields } as P)
        : props;

      return (
        <Fragment>
          <PreviewBar
            config={config}
            activeKey={previewKey}
            isLoading={previewLoading}
            onSelect={handlePreviewSelect}
          />
          <WrappedComponent {...editingProps} />
        </Fragment>
      );
    }

    const mergedProps = resolvedFields
      ? ({ ...props, fields: resolvedFields } as P)
      : props;

    return <WrappedComponent {...mergedProps} />;
  }

  PersonalizeConnectWrapper.displayName = `WithPersonalizeConnect(${componentName})`;

  return PersonalizeConnectWrapper;
}
