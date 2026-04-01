"use client";

import { cn } from "@/lib/utils";
import {
  DESIGN_CANVAS_PRESETS,
  type CanvasSizePreset,
} from "@/hooks/use-design-workflow";

type CanvasSizeSelectorProps = {
  selected: CanvasSizePreset | null;
  onSelect: (preset: CanvasSizePreset) => void;
};

const CANVAS_SIZE_OPTIONS: {
  value: CanvasSizePreset;
  label: string;
  dimensions: string;
}[] = [
  { value: "default", label: "Default", dimensions: `${DESIGN_CANVAS_PRESETS.default.width} × ${DESIGN_CANVAS_PRESETS.default.height}` },
  { value: "classic-borderless", label: "Classic borderless", dimensions: `${DESIGN_CANVAS_PRESETS["classic-borderless"].width} × ${DESIGN_CANVAS_PRESETS["classic-borderless"].height}` },
];

export function CanvasSizeSelector({ selected, onSelect }: CanvasSizeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-label font-semibold tracking-wide text-text-primary">
        Canvas size
      </span>
      <div className="grid grid-cols-2 gap-2">
        {CANVAS_SIZE_OPTIONS.map(({ value, label, dimensions }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 transition-colors",
              selected === value
                ? "border-accent-blue bg-accent-blue/12 text-accent-blue"
                : "border-surface-border bg-surface-raised text-text-secondary hover:border-surface-muted hover:text-text-primary",
            )}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs opacity-60">{dimensions}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
