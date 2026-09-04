"use client";

import { CANVAS_SIZE_PRESETS } from "@/hooks/use-prep-workflow";
import { canvasStepBounds, nearestCanvasStep } from "@/lib/canvas-utils";
import type { AspectRatio } from "@/lib/canvas-utils";
import type { CanvasSizingMode } from "@/hooks/use-prep-workflow";

type CanvasSizePanelProps = {
  canvasWidth: number;
  canvasHeight: number;
  canvasSizingMode: CanvasSizingMode;
  canvasAspect: AspectRatio;
  onSetCanvasSize: (width: number, height: number) => void;
  onSetCanvasSizingMode: (mode: CanvasSizingMode) => void;
  onSetCanvasSizeStep: (step: number) => void;
  onSetNativeCanvasDimension: (
    axis: "width" | "height",
    value: number,
  ) => void;
};

const MODES: { id: CanvasSizingMode; label: string }[] = [
  { id: "scale-image", label: "Scale image" },
  { id: "native-image", label: "Native image" },
];

function computeAspectRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

export function CanvasSizePanel({
  canvasWidth,
  canvasHeight,
  canvasSizingMode,
  canvasAspect,
  onSetCanvasSize,
  onSetCanvasSizingMode,
  onSetCanvasSizeStep,
  onSetNativeCanvasDimension,
}: CanvasSizePanelProps) {
  const isNative = canvasSizingMode === "native-image";
  const aspectRatio = isNative
    ? `${canvasAspect.w}:${canvasAspect.h}`
    : computeAspectRatio(canvasWidth, canvasHeight);
  const stepBounds = canvasStepBounds(canvasAspect);
  const step = nearestCanvasStep(canvasWidth, canvasAspect);

  return (
    <div className="flex flex-col gap-4">
      {/* Sizing mode */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Sizing mode
        </legend>
        <div
          role="group"
          aria-label="Canvas sizing mode"
          className="grid grid-cols-2 gap-2"
        >
          {MODES.map((mode) => {
            const isActive = canvasSizingMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                data-active={String(isActive)}
                aria-pressed={isActive}
                onClick={() => onSetCanvasSizingMode(mode.id)}
                className={`rounded px-3 py-1.5 text-xs ${
                  isActive
                    ? "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                    : "border border-surface-border bg-surface-ground text-text-primary hover:bg-surface-overlay"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
        {isNative && (
          <p className="mt-1.5 text-xs text-text-tertiary">
            Image stays at its native pixel size. The canvas keeps its{" "}
            {aspectRatio} ratio and crops on export.
          </p>
        )}
      </fieldset>

      <div className="h-px bg-surface-border" />

      {isNative ? (
        /* Canvas steps */
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
            Canvas size
          </legend>
          <input
            type="range"
            min={stepBounds.min}
            max={stepBounds.max}
            step={1}
            value={step}
            onChange={(e) => onSetCanvasSizeStep(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-subtle accent-accent-blue [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
            aria-label="Canvas size step"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-3">W</span>
              <input
                type="number"
                min={1}
                value={canvasWidth}
                onChange={(e) =>
                  onSetNativeCanvasDimension("width", Number(e.target.value))
                }
                className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
                aria-label="Canvas width"
              />
              <span className="text-text-tertiary">px</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-3">H</span>
              <input
                type="number"
                min={1}
                value={canvasHeight}
                onChange={(e) =>
                  onSetNativeCanvasDimension("height", Number(e.target.value))
                }
                className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
                aria-label="Canvas height"
              />
              <span className="text-text-tertiary">px</span>
            </label>
          </div>
          <p
            className="mt-1.5 text-xs text-text-tertiary"
            data-testid="canvas-aspect"
          >
            Aspect ratio: {aspectRatio}
          </p>
        </fieldset>
      ) : (
        <>
          {/* Dimensions */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
              Dimensions
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-3">W</span>
                <input
                  type="number"
                  min={100}
                  value={canvasWidth}
                  onChange={(e) =>
                    onSetCanvasSize(Number(e.target.value), canvasHeight)
                  }
                  className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
                  aria-label="Canvas width"
                />
                <span className="text-text-tertiary">px</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-3">H</span>
                <input
                  type="number"
                  min={100}
                  value={canvasHeight}
                  onChange={(e) =>
                    onSetCanvasSize(canvasWidth, Number(e.target.value))
                  }
                  className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
                  aria-label="Canvas height"
                />
                <span className="text-text-tertiary">px</span>
              </label>
            </div>
            <p className="mt-1.5 text-xs text-text-tertiary">
              Aspect ratio: {aspectRatio}
            </p>
          </fieldset>

          <div className="h-px bg-surface-border" />

          {/* Presets */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
              Presets
            </legend>
            <div className="flex flex-col gap-1.5">
              {CANVAS_SIZE_PRESETS.filter(
                (p) => p.label === "Default" || p.label === "Classic borderless",
              ).map((preset) => {
                const isActive =
                  canvasWidth === preset.width &&
                  canvasHeight === preset.height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    data-active={String(isActive)}
                    onClick={() => onSetCanvasSize(preset.width, preset.height)}
                    className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
                      isActive
                        ? "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                        : "border border-surface-border bg-surface-ground text-text-primary hover:bg-surface-overlay"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="font-mono text-text-tertiary">
                      {preset.width} x {preset.height}
                    </span>
                  </button>
                );
              })}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {CANVAS_SIZE_PRESETS.filter(
                  (p) =>
                    p.label !== "Default" && p.label !== "Classic borderless",
                ).map((preset) => {
                  const isActive =
                    canvasWidth === preset.width &&
                    canvasHeight === preset.height;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      data-active={String(isActive)}
                      onClick={() =>
                        onSetCanvasSize(preset.width, preset.height)
                      }
                      className={`rounded px-3 py-1.5 text-xs ${
                        isActive
                          ? "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                          : "border border-surface-border bg-surface-ground text-text-primary hover:bg-surface-overlay"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}

export { computeAspectRatio };
