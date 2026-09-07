"use client";

import { PAD_TARGETS } from "@/lib/padder-math";
import type { PadLayout, PadTargetId } from "@/lib/padder-math";
import { cn } from "@/lib/utils";

type TargetSelectorProps = {
  selectedId: PadTargetId;
  layout: PadLayout | null;
  onSelect: (targetId: PadTargetId) => void;
};

/**
 * The only input besides the file: which print target to pad to.
 * No scale, position or canvas-size control exists here by design.
 */
export function TargetSelector({
  selectedId,
  layout,
  onSelect,
}: TargetSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-micro font-bold tracking-extra-wide uppercase text-text-secondary">
        Select aspect ratio
      </h2>

      <div role="radiogroup" aria-label="Select aspect ratio" className="flex gap-2">
        {PAD_TARGETS.map((target) => {
          const selected = target.id === selectedId;
          return (
            <button
              key={target.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`target-option-${target.id}`}
              onClick={() => onSelect(target.id)}
              className={cn(
                "flex flex-1 flex-col items-start gap-1 rounded-lg border p-3 text-left",
                selected
                  ? "border-accent-blue bg-surface-raised"
                  : "border-white/10 bg-surface-base",
              )}
            >
              <span className="text-sm font-medium text-text-primary">
                {target.label}
              </span>
              <span className="text-xs text-text-secondary">
                {target.ratioLabel}
              </span>
            </button>
          );
        })}
      </div>

      {layout && (
        <dl className="flex flex-col gap-1 text-xs text-text-secondary">
          <div className="flex gap-2">
            <dt>Canvas</dt>
            <dd className="font-mono text-text-primary">
              <span data-testid="target-width">{layout.canvas.width}</span>
              {" x "}
              <span data-testid="target-height">{layout.canvas.height}</span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>Ratio</dt>
            <dd className="font-mono text-text-primary" data-testid="target-ratio">
              {layout.target.ratioLabel}
            </dd>
          </div>
        </dl>
      )}

      {layout && layout.croppedPixels > 0 && (
        <p className="text-xs text-text-secondary" data-testid="crop-note">
          The bottom {layout.croppedPixels}px of the scan falls outside this
          canvas and will be cut off.
        </p>
      )}
    </div>
  );
}
