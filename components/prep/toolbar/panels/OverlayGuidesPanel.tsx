"use client";

import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

type OverlayGuidesPanelProps = {
  selectedOverlays: string[];
  overlayOpacities: Record<string, number>;
  onToggleOverlay: (overlay: string) => void;
  onSetOverlayOpacity: (id: string, opacity: number) => void;
};

export function OverlayGuidesPanel({
  selectedOverlays,
  overlayOpacities,
  onToggleOverlay,
  onSetOverlayOpacity,
}: OverlayGuidesPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-tertiary">
        Overlays are visual-only and will not be included in downloads.
      </p>

      <div className="h-px bg-surface-border" />

      {OVERLAY_OPTIONS.map((option) => {
        const checked = selectedOverlays.includes(option.id);
        const opacity = overlayOpacities[option.id] ?? 100;

        return (
          <div key={option.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleOverlay(option.id)}
                  className="accent-accent-blue"
                />
                <span
                  className={
                    checked ? "text-text-primary" : "text-text-secondary"
                  }
                >
                  {option.label}
                </span>
              </label>
              <span className="text-xs text-text-tertiary">{opacity}%</span>
            </div>
            {checked && (
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={opacity}
                onChange={(e) =>
                  onSetOverlayOpacity(option.id, Number(e.target.value))
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-subtle accent-accent-blue [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
                aria-label={`${option.label} opacity`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
