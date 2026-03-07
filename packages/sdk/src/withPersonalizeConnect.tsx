"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { callPersonalize } from "./personalizeClient";
import { resolveContent } from "./contentResolver";
import { usePersonalizeContext } from "./PersonalizeProvider";
import type { ComponentFields, PersonalizeConnectConfig } from "./types";

export type GetConfigFromProps<P> = (props: P) => PersonalizeConnectConfig | undefined;

const DEFAULT_GET_CONFIG: GetConfigFromProps<{ rendering?: { personalizeConnect?: PersonalizeConnectConfig } }> = (
  props
) => (props as { rendering?: { personalizeConnect?: PersonalizeConnectConfig } }).rendering?.personalizeConnect;

/**
 * HOC that wraps any JSS/Content SDK component.
 * If the rendering has a personalizeConnect config, it renders with defaultKey first,
 * then asynchronously fetches the personalized content and re-renders.
 * If no config, passes through unchanged.
 */
export function withPersonalizeConnect<P extends object>(
  WrappedComponent: ComponentType<P>,
  getConfig: GetConfigFromProps<P> = DEFAULT_GET_CONFIG as GetConfigFromProps<P>
): ComponentType<P> {
  function PersonalizeConnectWrapper(props: P) {
    const context = usePersonalizeContext();
    const config = getConfig(props);
    const [resolvedFields, setResolvedFields] = useState<ComponentFields | null>(null);
    const mountedRef = useRef(true);

    const runPersonalization = useCallback(async () => {
      if (!config || !context) return;

      const contentKey = await callPersonalize({ config, context });
      if (!mountedRef.current) return;

      const resolved = await resolveContent({
        contentKey,
        config,
        resolveDatasource: context.resolveDatasource,
      });
      if (!mountedRef.current) return;

      if (resolved) {
        setResolvedFields(resolved.fields);
      }
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

    const mergedProps = {
      ...props,
      ...(resolvedFields ?? {}),
    } as P;

    return <WrappedComponent {...mergedProps} />;
  }

  PersonalizeConnectWrapper.displayName = `WithPersonalizeConnect(${
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"
  })`;

  return PersonalizeConnectWrapper;
}
