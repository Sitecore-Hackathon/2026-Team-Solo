"use client";

import { RefreshCw } from "lucide-react";
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
          className="h-9 w-9 p-0"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh experiences"
          aria-label="Refresh experiences"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
