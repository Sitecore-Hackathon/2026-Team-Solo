"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SaveButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function SaveButton({ onSave, disabled, children = "Save" }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    try {
      await onSave();
      toast.success("Configuration saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={disabled || saving}>
      {saving ? "Saving..." : children}
    </Button>
  );
}
