"use client";

import { Sparkles } from "lucide-react";

export function ConfigBadge({ hasConfig }: { hasConfig: boolean }) {
  if (!hasConfig) return null;
  return (
    <span
      className="inline-flex shrink-0 text-primary"
      title="Experience Linked"
      aria-label="Experience Linked"
    >
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}
