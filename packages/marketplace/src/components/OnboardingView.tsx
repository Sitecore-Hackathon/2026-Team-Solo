"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initializeModule } from "@/lib/module-installation";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

interface OnboardingViewProps {
  client: ClientSDK;
  sitecoreContextId: string;
  sitePath: string;
  onComplete: () => void;
}

export function OnboardingView({
  client,
  sitecoreContextId,
  sitePath,
  onComplete,
}: OnboardingViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await initializeModule(client, sitecoreContextId, sitePath);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error ?? "Initialization failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Initialize Personalize Connect</h1>
        <p className="text-sm text-muted-foreground">
          The Personalize Connect module needs to install Sitecore items in your tenant before you can use it. This creates templates and a settings folder used to store your component-to-experience mappings.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        onClick={handleInitialize}
        disabled={loading}
      >
        {loading ? "Initializing…" : "Initialize Module"}
      </Button>
    </div>
  );
}
