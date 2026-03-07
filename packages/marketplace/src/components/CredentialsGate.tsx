"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { getSitePathFromPagePath } from "@/lib/config-store";
import { loadCredentials } from "@/lib/credentials-store";
import { ConnectWizard } from "@/components/ConnectWizard";
import { PersonalizeConnectContent } from "@/components/PersonalizeConnectContent";

interface CredentialsGateProps {
  client: ClientSDK;
  sitecoreContextId: string;
  pageId: string;
  pagePath: string;
  presentationDetails?: string;
}

export function CredentialsGate({
  client,
  sitecoreContextId,
  pageId,
  pagePath,
  presentationDetails,
}: CredentialsGateProps) {
  const [credentials, setCredentials] = useState<Awaited<ReturnType<typeof loadCredentials>>>(null);
  const [loading, setLoading] = useState(true);
  const sitePath = getSitePathFromPagePath(pagePath);

  const load = useCallback(async () => {
    setLoading(true);
    const c = await loadCredentials(client, sitecoreContextId, sitePath);
    setCredentials(c);
    setLoading(false);
  }, [client, sitecoreContextId, sitePath]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading credentials…</p>
      </div>
    );
  }

  if (!credentials) {
    return (
      <ConnectWizard
        client={client}
        sitecoreContextId={sitecoreContextId}
        sitePath={sitePath}
        onComplete={load}
      />
    );
  }

  return (
    <PersonalizeConnectContent
      client={client}
      sitecoreContextId={sitecoreContextId}
      pageId={pageId}
      pagePath={pagePath}
      presentationDetails={presentationDetails}
      credentials={credentials}
    />
  );
}
