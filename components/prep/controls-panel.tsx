"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Minus,
  Plus,
  Search,
  Frame,
  ChevronDown,
  AlignCenterHorizontal,
  AlignVerticalSpaceAround,
} from "lucide-react";
import {
  OVERLAY_OPTIONS,
  type VerticalPreset,
} from "@/hooks/use-prep-workflow";
import { useRepeatOnHold } from "@/hooks/use-repeat-on-hold";

const MIN_SCALE = 0.5;
const SCALE_STEP = 0.01;

const OVERLAY_PRESET_MAP: Partial<Record<string, VerticalPreset>> = {
  normal: "normal",
  medium: "medium",
  short: "short",
  tall_normal: "tall",
};

type ControlsPanelProps = {
  scale: number;
  selectedOverlays: string[];
  onUpdateScale: (scale: number) => void;
  onToggleOverlay: (overlay: string) => void;
  onCenterHorizontal: () => void;
  onSetVerticalPreset?: (preset: VerticalPreset) => void;
};

export function ControlsPanel({
  scale,
  selectedOverlays,
  onUpdateScale,
  onToggleOverlay,
  onCenterHorizontal,
  onSetVerticalPreset,
}: ControlsPanelProps) {
  const scalePercent = Math.round(scale * 100);

  const activePreset = [...selectedOverlays]
    .reverse()
    .map((id) => OVERLAY_PRESET_MAP[id])
    .find((preset): preset is VerticalPreset => preset !== undefined);

  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const handleScaleDown = useCallback(() => {
    const current = scaleRef.current;
    const newScale = Math.max(MIN_SCALE, current - SCALE_STEP);
    onUpdateScale(Math.round(newScale * 100) / 100);
  }, [onUpdateScale]);

  const handleScaleUp = useCallback(() => {
    const current = scaleRef.current;
    const newScale = current + SCALE_STEP;
    onUpdateScale(Math.round(newScale * 100) / 100);
  }, [onUpdateScale]);

  const scaleDownHold = useRepeatOnHold(handleScaleDown);
  const scaleUpHold = useRepeatOnHold(handleScaleUp);

  return (
    <div
      className="flex flex-col gap-1.5 pl-8.5"
      role="group"
      aria-label="Controls"
    >
      {/* Scale Control */}
      <div className="flex flex-col gap-2 rounded-lg bg-surface-overlay px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Search className="size-3.5 text-text-secondary" />
          <span className="text-sm text-text-primary">Scale</span>
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-surface-border bg-surface-ground">
          <button
            type="button"
            disabled={scale <= MIN_SCALE}
            className="flex size-9 items-center justify-center text-text-primary disabled:text-text-disabled"
            aria-label="Decrease scale"
            {...scaleDownHold}
          >
            <Minus className="size-4" />
          </button>
          <div className="h-5 w-px bg-surface-border" />
          <span className="flex min-w-14 items-center justify-center font-mono text-label font-medium text-accent-blue">
            {scalePercent}%
          </span>
          <div className="h-5 w-px bg-surface-border" />
          <button
            type="button"
            className="flex size-9 items-center justify-center text-text-primary disabled:text-text-disabled"
            aria-label="Increase scale"
            {...scaleUpHold}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onCenterHorizontal}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-overlay px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary"
          aria-label="Center horizontally"
        >
          <AlignCenterHorizontal className="size-3.5" />
          <span>Center H</span>
        </button>
        {activePreset && onSetVerticalPreset && (
          <button
            type="button"
            onClick={() => onSetVerticalPreset(activePreset)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-overlay px-3 py-2.5 text-xs text-text-secondary hover:text-text-primary"
            aria-label="Apply vertical preset"
          >
            <AlignVerticalSpaceAround className="size-3.5" />
            <span>Vertical Preset</span>
          </button>
        )}
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
        <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg bg-surface-overlay px-3 py-2.5">
          {OVERLAY_OPTIONS.map((option) => {
            const checked = selectedOverlays.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleOverlay(option.id)}
                  className="accent-accent-blue"
                />
                <span className={checked ? "text-accent-blue" : ""}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}
