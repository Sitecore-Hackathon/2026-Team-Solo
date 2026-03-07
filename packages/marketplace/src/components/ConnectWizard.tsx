"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { saveCredentials } from "@/lib/credentials-store";

// Maps to https://api-engage-{region}.sitecorecloud.io
export const REGIONS = [
  { value: "ap", label: "AP Region" },
  { value: "eu", label: "EU Region" },
  { value: "jpe", label: "JP Region" },
  { value: "us", label: "US Region" },
] as const;

export function getRegionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}

export interface InitialCredentials {
  apiKey: string;
  region: string;
}

interface ConnectWizardProps {
  client: ClientSDK;
  sitecoreContextId: string;
  sitePath: string;
  onComplete: () => void;
  initialCredentials?: InitialCredentials;
  onCancel?: () => void;
}

export function ConnectWizard({
  client,
  sitecoreContextId,
  sitePath,
  onComplete,
  initialCredentials,
  onCancel,
}: ConnectWizardProps) {
  const [apiKey, setApiKey] = useState(initialCredentials?.apiKey ?? "");
  const [apiSecret, setApiSecret] = useState("");
  const [region, setRegion] = useState(initialCredentials?.region ?? "us");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setTestMessage({ type: "error", text: "Enter API Key and Secret first." });
      return;
    }
    setTesting(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/personalize/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setTestMessage({ type: "success", text: "Connection successful." });
      } else {
        setTestMessage({ type: "error", text: data.error ?? "Connection failed." });
      }
    } catch {
      setTestMessage({ type: "error", text: "Could not reach server." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setTestMessage({ type: "error", text: "Enter API Key and Secret." });
      return;
    }
    setSaving(true);
    setTestMessage(null);
    try {
      await saveCredentials(client, sitecoreContextId, sitePath, {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        region: region || "us",
      });
      onComplete();
    } catch (e) {
      setTestMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to save credentials.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isUpdate = !!initialCredentials;

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-input bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {isUpdate ? "Update Personalize credentials" : "Connect to Sitecore Personalize"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isUpdate
            ? "Re-enter your API Key and Secret to update. Existing values are pre-filled where possible."
            : "Personalize Connect requires access to your Sitecore Personalize tenant."}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API Key"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Your API Secret"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Create an API key in Sitecore Personalize under Developer Center →
          API Keys
        </p>

        {testMessage && (
          <p
            className={`mt-3 text-sm ${
              testMessage.type === "success" ? "text-green-600" : "text-destructive"
            }`}
          >
            {testMessage.text}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim() || !apiSecret.trim()}
          >
            {testing ? "Testing…" : "Test Connection"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !apiKey.trim() || !apiSecret.trim()}
          >
            {saving ? "Saving…" : isUpdate ? "Update" : "Save & Continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
