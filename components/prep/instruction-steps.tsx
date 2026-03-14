"use client";

import { cn } from "@/lib/utils";
import type { StepStatus } from "@/hooks/use-prep-workflow";

type InstructionStep = {
  number: number;
  title: string;
  description: string;
};

const INSTRUCTIONS: InstructionStep[] = [
  {
    number: 1,
    title: "Upload card art",
    description: "Drag and drop or click to browse for your card image.",
  },
  {
    number: 2,
    title: "Position on canvas",
    description:
      "Drag to reposition and scroll to zoom your image on the canvas.",
  },
  {
    number: 3,
    title: "Download prepared image",
    description: "Export your positioned card art as a PNG file.",
  },
];

type InstructionStepsProps = {
  stepStatuses: StepStatus[];
};

export function InstructionSteps({ stepStatuses }: InstructionStepsProps) {
  return (
    <aside aria-label="Instructions">
      <ol className="flex flex-col gap-7 list-none m-0 p-0">
        {INSTRUCTIONS.map((step, i) => {
          const status = stepStatuses[i];

          return (
            <li key={step.number} className="flex gap-3">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  status === "active" && "bg-accent-blue text-white",
                  status === "completed" && "bg-accent-blue text-white",
                  status === "upcoming" &&
                    "border border-surface-muted bg-transparent text-text-tertiary",
                )}
              >
                {step.number}
              </div>
              <div className="pl-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-6",
                    status === "upcoming"
                      ? "text-text-secondary"
                      : "text-text-primary",
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    status === "upcoming"
                      ? "text-text-tertiary"
                      : "text-text-secondary",
                  )}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
