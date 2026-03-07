"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonalizeExperience } from "@/hooks/usePersonalizeExperiences";

interface ExperiencePickerProps {
  experiences: PersonalizeExperience[];
  loading: boolean;
  onSelect: (exp: PersonalizeExperience | null) => void;
  selectedExperience: PersonalizeExperience | null;
  onRefresh?: () => void;
}

export function ExperiencePicker({
  experiences,
  loading,
  onSelect,
  selectedExperience,
  onRefresh,
}: ExperiencePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Link to Experience</p>
      <div className="flex gap-2">
        <Select
          value={selectedExperience?.id ?? ""}
          onValueChange={(id) => {
            if (!id) {
              onSelect(null);
              return;
            }
            const exp = experiences.find((e) => e.id === id) ?? null;
            onSelect(exp);
          }}
          disabled={loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={loading ? "Loading..." : "Choose an experience"} />
          </SelectTrigger>
          <SelectContent>
            {experiences.map((exp) => (
              <SelectItem key={exp.id} value={exp.id}>
                {exp.name ?? exp.friendlyId ?? exp.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh experiences"
          aria-label="Refresh experiences"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
