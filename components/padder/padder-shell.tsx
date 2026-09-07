import Link from "next/link";
import { cn } from "@/lib/utils";

const PADDER_STEPS = [
  { id: "pad", label: "Pad" },
  { id: "outpaint", label: "Outpaint" },
] as const;

type PadderShellProps = {
  /** 1 = /padder, 2 = /padder-outpaint. */
  currentStep: 1 | 2;
  children: React.ReactNode;
};

/** Shared chrome for both padder routes. The 3-step Prep header does not apply. */
export function PadderShell({ currentStep, children }: PadderShellProps) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border bg-surface-header px-4">
        <Link href="/" data-testid="padder-home-link">
          <span className="text-caption font-semibold uppercase tracking-label text-accent-blue">
            Padder
          </span>
        </Link>

        <nav aria-label="Padder steps" className="flex items-center gap-2">
          {PADDER_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === currentStep;
            return (
              <span
                key={step.id}
                data-testid={`padder-step-${step.id}`}
                aria-current={isCurrent ? "step" : "false"}
                className={cn(
                  "text-caption font-medium",
                  isCurrent ? "text-accent-blue" : "text-text-secondary",
                )}
              >
                {step.label}
              </span>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
