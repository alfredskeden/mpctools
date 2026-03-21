"use client";

import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

type OverlaySelectorProps = {
  selectedOverlays: string[];
  onToggleOverlay: (overlay: string) => void;
};

export function OverlaySelector({
  selectedOverlays,
  onToggleOverlay,
}: OverlaySelectorProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Overlay options"
    >
      {OVERLAY_OPTIONS.map((option) => {
        const checked = selectedOverlays.includes(option.id);
        return (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleOverlay(option.id)}
              className="accent-primary"
            />
            <span
              className={
                checked ? "text-primary-foreground" : "text-foreground"
              }
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
