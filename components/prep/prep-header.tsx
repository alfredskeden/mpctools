"use client";

import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/step-indicator";
import type { StepStatus } from "@/hooks/use-prep-workflow";

const STEP_LABELS = ["Prep", "Outpaint", "Merge"];

type PrepHeaderProps = {
  stepStatuses: StepStatus[];
};

export function PrepHeader({ stepStatuses }: PrepHeaderProps) {
  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: stepStatuses[i] === "active" || stepStatuses[i] === "completed",
  }));

  return (
    <header className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">STEP 1</Badge>
        <h1 className="text-xl font-semibold tracking-tight">Prepare Image</h1>
      </div>
      <StepIndicator
        steps={steps}
        className="relative bottom-auto left-auto flex translate-x-0 items-center"
      />
    </header>
  );
}
