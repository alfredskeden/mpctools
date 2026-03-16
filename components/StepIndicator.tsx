import { cn } from "@/lib/utils";

type Step = {
  label: string;
  active: boolean;
};

type StepIndicatorProps = {
  steps: Step[];
  className?: string;
  variant?: "default" | "landing";
};

export const StepIndicator = ({
  steps,
  className,
  variant = "default",
}: StepIndicatorProps) => {
  if (variant === "landing") {
    return (
      <nav
        aria-label="Build steps"
        className={cn(
          "absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center",
          className,
        )}
      >
        <ol className="flex items-center gap-3 list-none m-0 p-0">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded text-micro font-bold",
                    step.active
                      ? "bg-accent-blue text-white"
                      : "border border-surface-subtle text-text-tertiary",
                  )}
                >
                  {i + 1}
                </div>
                <span
                  aria-current={step.active ? "step" : undefined}
                  className={cn(
                    "text-xs leading-4",
                    step.active
                      ? "font-medium text-text-primary"
                      : "font-normal text-text-tertiary",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  role="separator"
                  aria-hidden="true"
                  className="h-px w-6 bg-surface-subtle"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Build steps"
      className={cn(
        "absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center",
        className,
      )}
    >
      <ol className="flex items-center gap-0 list-none m-0 p-0">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-0">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  step.active ? "bg-accent-blue" : "bg-surface-subtle",
                )}
              />
              <span
                aria-current={step.active ? "step" : undefined}
                className={cn(
                  "text-caption hidden font-medium leading-3.5 sm:inline",
                  step.active
                    ? "text-accent-blue"
                    : "font-normal text-text-disabled",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                role="separator"
                aria-hidden="true"
                className="h-px w-5 shrink-0 bg-surface-border sm:w-8"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
