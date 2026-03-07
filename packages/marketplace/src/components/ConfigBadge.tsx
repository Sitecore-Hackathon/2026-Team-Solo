"use client";

import { Badge } from "@/components/ui/badge";

export function ConfigBadge({ hasConfig }: { hasConfig: boolean }) {
  if (!hasConfig) return null;
  return (
    <Badge variant="success" className="ml-2 shrink-0">
      Personalized
    </Badge>
  );
}
