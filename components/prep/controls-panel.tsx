"use client";

import { Search, Frame, ChevronDown } from "lucide-react";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

type ControlsPanelProps = {
  scale: number;
  selectedOverlay: string | null;
  rotation: number;
  onUpdateScale: (scale: number) => void;
  onSelectOverlay: (overlay: string | null) => void;
  onUpdateRotation: (rotation: number) => void;
};

export function ControlsPanel({
  scale,
  selectedOverlay,
  onUpdateScale,
  onSelectOverlay,
}: ControlsPanelProps) {
  const scalePercent = Math.round(scale * 100);

  return (
    <div
      className="flex flex-col gap-1.5 pl-8.5"
      role="group"
      aria-label="Controls"
    >
      {/* Scale Control */}
      <div className="flex flex-col gap-2 rounded-lg bg-surface-overlay px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Search className="size-3.5 text-text-secondary" />
            <span className="text-sm text-text-primary">Scale</span>
          </div>
          <span className="text-xs font-medium text-accent-blue">
            {scalePercent}%
          </span>
        </div>
        <input
          type="range"
          min={MIN_SCALE * 100}
          max={MAX_SCALE * 100}
          value={scalePercent}
          onChange={(e) => onUpdateScale(Number(e.target.value) / 100)}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-subtle accent-accent-blue [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
          aria-label="Scale"
        />
      </div>
      {/* Frame Overlay Control */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-surface-overlay px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Frame className="size-3.5 text-text-secondary" />
            <span className="text-sm text-text-primary">Frame Overlay</span>
          </div>
          <ChevronDown className="size-3 text-text-secondary transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-lg bg-surface-overlay px-3 py-2.5">
          <button
            type="button"
            className={`rounded-md border px-2.5 py-1 text-xs ${
              selectedOverlay === null
                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                : "border-surface-subtle bg-transparent text-text-secondary"
            }`}
            onClick={() => onSelectOverlay(null)}
          >
            None
          </button>
          {OVERLAY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-md border px-2.5 py-1 text-xs ${
                selectedOverlay === option.id
                  ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                  : "border-surface-subtle bg-transparent text-text-secondary"
              }`}
              onClick={() => onSelectOverlay(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
