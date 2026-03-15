"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type MergerActionsProps = {
  canDownload: boolean;
  isDownloaded: boolean;
  featherStrength: number;
  onDownload: () => void;
  onFeatherChange: (value: number) => void;
};

export function MergerActions({
  canDownload,
  isDownloaded,
  featherStrength,
  onDownload,
  onFeatherChange,
}: MergerActionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <footer className="flex flex-col gap-4">
      {isDownloaded ? (
        <button
          type="button"
          disabled
          className="h-11 w-full rounded-lg border border-status-success-dark bg-surface-overlay text-sm font-medium text-status-success"
        >
          Downloaded ✓
        </button>
      ) : (
        <button
          type="button"
          disabled={!canDownload}
          onClick={onDownload}
          className={cn(
            "h-11 w-full rounded-lg text-sm font-medium transition-colors",
            canDownload
              ? "bg-accent-blue text-white hover:bg-accent-blue/90"
              : "bg-surface-overlay text-text-primary opacity-40 cursor-not-allowed",
          )}
        >
          Download Merged
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs font-medium tracking-extra-wide text-text-tertiary"
      >
        ADVANCED OPTIONS
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            showAdvanced && "rotate-180",
          )}
        />
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-overlay p-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feather-slider"
                className="text-xs text-text-secondary"
              >
                Feather Strength
              </label>
              <span className="text-xs text-text-tertiary">
                {featherStrength}px
              </span>
            </div>
            <input
              id="feather-slider"
              type="range"
              min={0}
              max={200}
              value={featherStrength}
              onChange={(e) => onFeatherChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Layers</span>
            <span className="text-xs text-text-tertiary">OG + Outpaint</span>
          </div>
        </div>
      )}
    </footer>
  );
}
