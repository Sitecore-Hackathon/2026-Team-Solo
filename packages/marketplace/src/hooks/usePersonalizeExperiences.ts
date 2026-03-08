"use client";

import { useCallback, useState } from "react";
import type { PersonalizeCredentials } from "@/lib/credentials-store";

export interface PersonalizeExperience {
  id: string;
  ref?: string;
  friendlyId?: string;
  name?: string;
  status?: string;
  type?: string;
  subtype?: string;
}

export interface PersonalizeVariant {
  ref?: string;
  name?: string;
  isControl?: boolean;
}

export interface PersonalizeExperienceDetail extends PersonalizeExperience {
  variants?: PersonalizeVariant[];
  traffic?: {
    type?: string;
    allocation?: number;
    splits?: Array<{ ref?: string; percentage?: number }>;
  };
  templates?: string[];
}

export function usePersonalizeExperiences(credentials: PersonalizeCredentials | null) {
  const [experiences, setExperiences] = useState<PersonalizeExperience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchExperiences = useCallback(async () => {
    if (!credentials?.apiKey || !credentials?.apiSecret) {
      setError(new Error("Configure Personalize API credentials in the setup wizard"));
      setExperiences([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/personalize/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          region: credentials.region ?? "us",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `API error: ${res.status}`);
      const all: PersonalizeExperience[] = Array.isArray(data) ? data : [];
      const isInteractiveExperience = (f: PersonalizeExperience) => {
        const sub = (f.subtype ?? "").toUpperCase();
        const typ = (f.type ?? "").toUpperCase();
        return sub === "EXPERIENCE" && typ.includes("INTERACTIVE");
      };
      setExperiences(all.filter(isInteractiveExperience));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [credentials?.apiKey, credentials?.apiSecret, credentials?.region]);

  const fetchExperienceDetail = useCallback(
    async (experienceId: string): Promise<PersonalizeExperienceDetail | null> => {
      if (!credentials?.apiKey || !credentials?.apiSecret) return null;
      try {
        const res = await fetch(
          `/api/personalize/experience/${encodeURIComponent(experienceId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: credentials.apiKey,
              apiSecret: credentials.apiSecret,
              region: credentials.region ?? "us",
            }),
          }
        );
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    [credentials?.apiKey, credentials?.apiSecret, credentials?.region]
  );

  return {
    experiences,
    loading,
    error,
    fetchExperiences,
    fetchExperienceDetail,
  };
}
