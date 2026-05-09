"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  testId?: string;
};

export function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
  testId,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-testid={testId}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4.5 w-8 shrink-0 rounded-full border transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-accent-blue bg-accent-blue"
          : "border-surface-border bg-surface-overlay",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0.5 left-0.5 size-3 rounded-full transition-transform",
          checked ? "translate-x-3.5 bg-white" : "bg-text-secondary",
        )}
      />
    </button>
  );
}
