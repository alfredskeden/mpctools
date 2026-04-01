"use client";

import { cn } from "@/lib/utils";
import type { TextBoxSize } from "@/hooks/use-design-workflow";

type SizeSelectorProps = {
  selected: TextBoxSize | null;
  onSelect: (size: TextBoxSize) => void;
};

const SIZE_OPTIONS: { value: TextBoxSize; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "normal", label: "Normal" },
  { value: "tall", label: "Tall" },
];

export function SizeSelector({ selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-label font-semibold tracking-wide text-text-primary">
        Text box size
      </span>
      <div className="grid grid-cols-4 gap-2">
        {SIZE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
              selected === value
                ? "border-accent-blue bg-accent-blue/12 text-accent-blue"
                : "border-surface-border bg-surface-raised text-text-secondary hover:border-surface-muted hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
