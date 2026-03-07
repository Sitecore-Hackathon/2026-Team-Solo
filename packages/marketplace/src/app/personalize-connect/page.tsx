"use client";

import { useMarketplaceContext } from "@/providers/MarketplaceProvider";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ModuleGate } from "@/components/ModuleGate";
import { CredentialsGate } from "@/components/CredentialsGate";

export default function PersonalizeConnectPage() {
  const { client, appContext, pagesContext, error, loading } = useMarketplaceContext();

  const pageInfo = pagesContext?.pageInfo;
  const pageId = pageInfo?.id;
  const pagePath = pageInfo?.path;
  const presentationDetails = (pageInfo as Record<string, unknown>)?.presentationDetails as string | undefined;
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
      <CredentialsGate
        client={client}
        sitecoreContextId={sitecoreContextId}
        pageId={pageId ?? ""}
        pagePath={pagePath ?? ""}
        presentationDetails={presentationDetails}
      />
    </ModuleGate>
  );
}
