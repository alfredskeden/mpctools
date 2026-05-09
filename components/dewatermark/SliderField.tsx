"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  format?: (value: number) => string;
  testId?: string;
};

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
  format,
  testId,
}: SliderFieldProps) {
  const inputId = useId();
  const display = format ? format(value) : String(value);

  return (
    <div className="flex flex-col gap-1.5" data-testid={testId}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-caption font-medium text-text-primary"
        >
          {label}
        </label>
        <span
          className="min-w-9 rounded-xs bg-surface-raised px-1.5 py-px text-center font-mono text-caption text-text-secondary"
          data-testid={testId ? `${testId}-value` : undefined}
        >
          {display}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-overlay",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </div>
  );
}
