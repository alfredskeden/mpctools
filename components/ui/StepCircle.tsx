import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/lib/step-types";

export function StepCircle({
  status,
  number,
}: {
  status: StepStatus;
  number: number;
}) {
  if (status === "completed") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-status-success-dark">
        <Check className="size-3 text-white" strokeWidth={3} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
        status === "active" && "bg-accent-blue text-white",
        status === "upcoming" &&
          "border border-surface-muted bg-transparent text-text-tertiary",
      )}
    >
      {number}
    </div>
  );
}
