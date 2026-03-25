"use client";

type DpiOverridePanelProps = {
  dpiOverride: number | null;
  onSetDpiOverride: (dpi: number | null) => void;
};

export function DpiOverridePanel({
  dpiOverride,
  onSetDpiOverride,
}: DpiOverridePanelProps) {
  const scaleFactor = dpiOverride ? 1200 / dpiOverride : null;
  const scalePercent = scaleFactor ? Math.round(scaleFactor * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-tertiary">
        Scales the uploaded image based on DPI.
        <br />
        Formula: Scale = 1200 / DPI.
      </p>

      <div className="h-px bg-surface-border" />

      {/* DPI Value */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          DPI Value
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={dpiOverride ?? ""}
            placeholder="300"
            onChange={(e) => {
              const val = e.target.value;
              onSetDpiOverride(val === "" ? null : Number(val));
            }}
            className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-disabled"
            aria-label="DPI value"
          />
          <span className="text-xs text-text-tertiary">DPI</span>
        </div>
        {scaleFactor !== null && (
          <p className="mt-1.5 rounded bg-surface-overlay px-2 py-1 text-xs">
            Scale factor:{" "}
            <span className="font-mono font-medium text-accent-blue">
              {scaleFactor.toFixed(2)}x
            </span>{" "}
            <span className="text-text-tertiary">({scalePercent}%)</span>
          </p>
        )}
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Quick Presets */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Quick Presets
        </legend>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            data-active={String(dpiOverride === 270)}
            onClick={() => onSetDpiOverride(270)}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
              dpiOverride === 270
                ? "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                : "border border-surface-border bg-surface-ground text-text-primary hover:bg-surface-overlay"
            }`}
          >
            <span>270 DPI</span>
            <span className="font-mono text-text-tertiary">4.44x</span>
          </button>
          <button
            type="button"
            data-active={String(dpiOverride === 300)}
            onClick={() => onSetDpiOverride(300)}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
              dpiOverride === 300
                ? "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                : "border border-surface-border bg-surface-ground text-text-primary hover:bg-surface-overlay"
            }`}
          >
            <span>300 DPI</span>
            <span className="font-mono text-text-tertiary">4.00x</span>
          </button>
          <button
            type="button"
            onClick={() => onSetDpiOverride(null)}
            className="rounded border border-surface-border bg-surface-ground px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay"
          >
            Clear Override
          </button>
        </div>
      </fieldset>

      <div className="h-px bg-surface-border" />

      <p className="rounded bg-surface-overlay px-3 py-2 text-xs text-text-tertiary">
        Scryfall scans are always 300 DPI. Use this to auto-scale your image to
        the correct print size.
      </p>
    </div>
  );
}
