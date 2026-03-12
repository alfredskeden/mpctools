type Step = {
  label: string;
  active: boolean;
};

type StepIndicatorProps = {
  steps: Step[];
};

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Build steps"
      className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center"
    >
      <ol className="flex items-center gap-8 list-none m-0 p-0">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  step.active ? "bg-brand" : "bg-secondary"
                }`}
              />
              <span
                aria-current={step.active ? "step" : undefined}
                className={`text-xs leading-4 ${
                  step.active
                    ? "font-medium text-brand"
                    : "font-normal text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                role="separator"
                aria-hidden="true"
                className="h-px w-8 bg-secondary"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
