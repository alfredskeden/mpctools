"use client";

import { Upload, Move, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/hooks/use-prep-workflow";

type InstructionStep = {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const INSTRUCTIONS: InstructionStep[] = [
  {
    number: 1,
    title: "Upload card art",
    description: "Drag and drop or click to browse for your card image.",
    icon: Upload,
  },
  {
    number: 2,
    title: "Position on canvas",
    description: "Drag to reposition and scroll to zoom your image on the canvas.",
    icon: Move,
  },
  {
    number: 3,
    title: "Download prepared image",
    description: "Export your positioned card art as a PNG file.",
    icon: Download,
  },
];

type InstructionStepsProps = {
  stepStatuses: StepStatus[];
};

export function InstructionSteps({ stepStatuses }: InstructionStepsProps) {
  return (
    <aside aria-label="Instructions">
      <ol className="flex flex-col gap-4 list-none m-0 p-0">
        {INSTRUCTIONS.map((step, i) => {
          const status = stepStatuses[i];
          const Icon = step.icon;

          return (
            <li
              key={step.number}
              className={cn(
                "flex gap-3 rounded-lg border p-4 transition-colors",
                status === "active" && "border-brand bg-brand/5",
                status === "completed" && "border-muted bg-muted/50",
                status === "upcoming" && "border-transparent opacity-50",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  status === "active" && "bg-brand text-brand-foreground",
                  status === "completed" && "bg-muted text-muted-foreground",
                  status === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <p className="font-medium leading-none">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
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
