"use client";

import { StepIndicator } from "@/components/step-indicator";
import type { StepStatus } from "@/hooks/use-prep-workflow";

const STEP_LABELS = ["Prep", "Outpaint", "Merge"];

type HeaderProps = {
  stepStatuses: StepStatus[];
};

export function Header({ stepStatuses }: HeaderProps) {
  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: stepStatuses[i] === "active" || stepStatuses[i] === "completed",
  }));

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised px-4">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-accent-blue">
          STEP 1
        </span>
        <span className="text-[13px] font-medium text-text-primary">
          Prepare Image
        </span>
      </div>
      <StepIndicator
        steps={steps}
        className="relative bottom-auto left-auto flex translate-x-0 items-center"
      />
    </header>
  );
}
