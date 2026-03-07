"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepSectionProps {
  step: number;
  title: string;
  subtitle?: string;
  state: "complete" | "active" | "pending";
  children?: React.ReactNode;
}

export function StepSection({
  step,
  title,
  subtitle,
  state,
  children,
}: StepSectionProps) {
  return (
    <div className={cn("flex gap-3", state === "pending" && "opacity-40 pointer-events-none")}>
      <div className="flex flex-col items-center pt-0.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
            state === "complete" && "bg-primary text-white",
            state === "active" && "border-2 border-primary text-primary",
            state === "pending" && "border-2 border-muted-foreground/30 text-muted-foreground/50"
          )}
        >
          {state === "complete" ? (
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          ) : (
            step
          )}
        </span>
      </div>
      <div className="flex-1 min-w-0 pb-5">
        <h3 className="text-sm font-semibold leading-6">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {(state === "active" || state === "complete") && children && (
          <div className="mt-3">{children}</div>
        )}
      </div>
    </div>
  );
}
