"use client";

import { useMarketplaceContext } from "@/providers/MarketplaceProvider";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ModuleGate } from "@/components/ModuleGate";
import { SettingsContent } from "@/components/SettingsContent";

export default function SettingsPage() {
  const { client, appContext, pagesContext, error, loading } = useMarketplaceContext();

  const pageInfo = pagesContext?.pageInfo;
  const pagePath = pageInfo?.path;
  const sitecoreContextId = appContext?.resourceAccess?.[0]?.context?.preview;

  if (loading && !client && !error) {
    return <ConnectionStatus status="connecting" />;
  }

  if (error) {
    return <ConnectionStatus status="error" message={error} />;
  }

  if (!pageInfo) {
    return <ConnectionStatus status="waiting-page" />;
  }

  if (!client || !sitecoreContextId) {
    return <ConnectionStatus status="waiting-page" />;
  }

  return (
    <ModuleGate
      client={client}
      sitecoreContextId={sitecoreContextId}
      pagePath={pagePath ?? ""}
    >
      <SettingsContent
        client={client}
        sitecoreContextId={sitecoreContextId}
        pagePath={pagePath ?? ""}
      />
    </ModuleGate>
  );
}
