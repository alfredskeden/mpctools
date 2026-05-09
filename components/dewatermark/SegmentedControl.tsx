"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  ariaLabel: string;
  testId?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
  testId,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-testid={testId}
      className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-md border border-surface-border bg-surface-raised p-0.5"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            data-active={active ? "true" : undefined}
            className={cn(
              "rounded-sm px-2 py-1.5 font-mono text-caption uppercase tracking-label transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-surface-overlay text-text-primary"
                : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
