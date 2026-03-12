"use client";

import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

type OverlaySelectorProps = {
  selectedOverlay: string | null;
  onSelectOverlay: (overlay: string | null) => void;
};

export function OverlaySelector({
  selectedOverlay,
  onSelectOverlay,
}: OverlaySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Overlay options">
      <button
        type="button"
        className={`rounded-md border px-3 py-1.5 text-sm ${
          selectedOverlay === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background"
        }`}
        onClick={() => onSelectOverlay(null)}
      >
        None
      </button>
      {OVERLAY_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            selectedOverlay === option.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background"
          }`}
          onClick={() => onSelectOverlay(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
