"use client";

import { StepIndicator } from "@/components/StepIndicator";
import type { StepStatus } from "@/hooks/use-prep-workflow";

const STEP_LABELS = ["Prep", "Outpaint", "Merge"];

const STEP_TITLES: Record<number, string> = {
  1: "Prepare Image",
  2: "Outpaint with Gemini",
  3: "Merge Result",
};

type HeaderProps = {
  currentStep: number;
  stepStatuses: StepStatus[];
};

export function Header({ currentStep, stepStatuses }: HeaderProps) {
  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: stepStatuses[i] === "active" || stepStatuses[i] === "completed",
  }));

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border bg-surface-header px-4">
      <div className="flex items-center gap-2">
        <span className="text-label font-semibold text-accent-blue">
          STEP {currentStep}
        </span>
        <span className="text-text-faint" aria-hidden="true">
          |
        </span>
        <span className="text-label font-medium text-text-primary">
          {STEP_TITLES[currentStep]}
        </span>
      </div>
      <StepIndicator
        steps={steps}
        className="relative bottom-auto left-auto flex translate-x-0 items-center"
      />
    </header>
  );
}
