"use client";

import { useEffect, useState } from "react";
import { getModuleInstallationStatus } from "@/lib/module-installation";
import { getSitePathFromPagePath } from "@/lib/config-store";
import { OnboardingView } from "@/components/OnboardingView";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

interface ModuleGateProps {
  client: ClientSDK;
  sitecoreContextId: string;
  pagePath: string;
  children: React.ReactNode;
}

export function ModuleGate({
  client,
  sitecoreContextId,
  pagePath,
  children,
}: ModuleGateProps) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const sitePath = getSitePathFromPagePath(pagePath);

  useEffect(() => {
    let cancelled = false;
    getModuleInstallationStatus(client, sitecoreContextId, sitePath).then((status) => {
      if (!cancelled) setInstalled(status.isInstalled);
    });
    return () => {
      cancelled = true;
    };
  }, [client, sitecoreContextId, sitePath]);

  if (installed === null) {
    return <ConnectionStatus status="checking-module" />;
  }

  if (!installed) {
    return (
      <OnboardingView
        client={client}
        sitecoreContextId={sitecoreContextId}
        sitePath={sitePath}
        onComplete={() => setInstalled(true)}
      />
    );
  }

  return <>{children}</>;
}
