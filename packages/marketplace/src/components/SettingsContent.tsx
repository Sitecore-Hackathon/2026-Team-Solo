"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { getSitePathFromPagePath } from "@/lib/config-store";
import { loadCredentials, type PersonalizeCredentials } from "@/lib/credentials-store";
import { ConnectWizard } from "@/components/ConnectWizard";
import { getRegionLabel } from "@/components/ConnectWizard";
import { Button } from "@/components/ui/button";
import { Key, Lock, Globe } from "lucide-react";

function maskApiKey(key: string): string {
  if (key.length <= 4) return "••••";
  return "••••••••••••" + key.slice(-4);
}

function maskSecret(): string {
  return "••••••••••••••••";
}

interface SettingsContentProps {
  client: ClientSDK;
  sitecoreContextId: string;
  pagePath: string;
}

export function SettingsContent({
  client,
  sitecoreContextId,
  pagePath,
}: SettingsContentProps) {
  const [credentials, setCredentials] = useState<PersonalizeCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdate, setShowUpdate] = useState(false);
  const sitePath = getSitePathFromPagePath(pagePath);

  const load = useCallback(async () => {
    setLoading(true);
    const c = await loadCredentials(client, sitecoreContextId, sitePath);
    setCredentials(c);
    setLoading(false);
    setShowUpdate(false);
  }, [client, sitecoreContextId, sitePath]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  if (!credentials && !showUpdate) {
    return (
      <ConnectWizard
        client={client}
        sitecoreContextId={sitecoreContextId}
        sitePath={sitePath}
        onComplete={load}
      />
    );
  }

  if (showUpdate || !credentials) {
    return (
      <ConnectWizard
        client={client}
        sitecoreContextId={sitecoreContextId}
        sitePath={sitePath}
        onComplete={load}
        onCancel={credentials ? () => setShowUpdate(false) : undefined}
        initialCredentials={
          credentials
            ? { apiKey: credentials.apiKey, region: credentials.region ?? "us" }
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex min-h-[300px] flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Personalize settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current API key configuration for this site
        </p>
      </div>

      <div className="w-full max-w-md space-y-4 rounded-lg border border-input bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">API Key</p>
            <p className="font-mono text-sm">{maskApiKey(credentials.apiKey)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">API Secret</p>
            <p className="font-mono text-sm">{maskSecret()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Region</p>
            <p className="text-sm">{getRegionLabel(credentials.region ?? "us")}</p>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={() => setShowUpdate(true)}>
        Update credentials
      </Button>
    </div>
  );
}
