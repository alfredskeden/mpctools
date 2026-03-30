"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { track } from "@/lib/analytics";

type MergerActionsProps = {
  canDownload: boolean;
  isDownloaded: boolean;
  featherStrength: number;
  irregMagnitude: number;
  irregDensity: number;
  irregRadius: number;
  irregBlur: number;
  onDownload: () => void;
  onFeatherChange: (value: number) => void;
  onIrregMagnitudeChange: (value: number) => void;
  onIrregDensityChange: (value: number) => void;
  onIrregRadiusChange: (value: number) => void;
  onIrregBlurChange: (value: number) => void;
  onReseed: () => void;
};

export function MergerActions({
  canDownload,
  isDownloaded,
  featherStrength,
  irregMagnitude,
  irregDensity,
  irregRadius,
  irregBlur,
  onDownload,
  onFeatherChange,
  onIrregMagnitudeChange,
  onIrregDensityChange,
  onIrregRadiusChange,
  onIrregBlurChange,
  onReseed,
}: MergerActionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <footer className="flex flex-col gap-4">
      {isDownloaded ? (
        <button
          type="button"
          disabled
          data-downloaded="true"
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
              onPointerUp={(e) => track("merger_blending_adjusted", { param: "feather", value: Number((e.target as HTMLInputElement).value) })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="irreg-magnitude-slider"
                className="text-xs text-text-secondary"
              >
                Magnitude
              </label>
              <span className="text-xs text-text-tertiary">
                {irregMagnitude}px
              </span>
            </div>
            <input
              id="irreg-magnitude-slider"
              type="range"
              min={0}
              max={300}
              value={irregMagnitude}
              onChange={(e) => onIrregMagnitudeChange(Number(e.target.value))}
              onPointerUp={(e) => track("merger_blending_adjusted", { param: "irreg_magnitude", value: Number((e.target as HTMLInputElement).value) })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="irreg-density-slider"
                className="text-xs text-text-secondary"
              >
                Density
              </label>
              <span className="text-xs text-text-tertiary">
                {irregDensity}%
              </span>
            </div>
            <input
              id="irreg-density-slider"
              type="range"
              min={0}
              max={100}
              value={irregDensity}
              onChange={(e) => onIrregDensityChange(Number(e.target.value))}
              onPointerUp={(e) => track("merger_blending_adjusted", { param: "irreg_density", value: Number((e.target as HTMLInputElement).value) })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="irreg-radius-slider"
                className="text-xs text-text-secondary"
              >
                Irreg Radius
              </label>
              <span className="text-xs text-text-tertiary">
                {irregRadius}px
              </span>
            </div>
            <input
              id="irreg-radius-slider"
              type="range"
              min={0}
              max={500}
              value={irregRadius}
              onChange={(e) => onIrregRadiusChange(Number(e.target.value))}
              onPointerUp={(e) => track("merger_blending_adjusted", { param: "irreg_radius", value: Number((e.target as HTMLInputElement).value) })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="irreg-blur-slider"
                className="text-xs text-text-secondary"
              >
                Edge Blur
              </label>
              <span className="text-xs text-text-tertiary">
                {irregBlur}px
              </span>
            </div>
            <input
              id="irreg-blur-slider"
              type="range"
              min={0}
              max={100}
              value={irregBlur}
              onChange={(e) => onIrregBlurChange(Number(e.target.value))}
              onPointerUp={(e) => track("merger_blending_adjusted", { param: "irreg_blur", value: Number((e.target as HTMLInputElement).value) })}
              className="w-full"
            />
          </div>
          <button
            type="button"
            onClick={onReseed}
            className="h-8 w-full rounded-md border border-surface-border bg-surface-base text-xs font-medium text-text-secondary transition-colors hover:bg-surface-overlay"
          >
            Reseed
          </button>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Layer Toggles</span>
            <span className="font-mono text-xs text-text-tertiary">OG + Outpaint</span>
          </div>
        </div>
      )}
    </footer>
  );
}
