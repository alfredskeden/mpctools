"use client";

import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DetectionCard } from "@/components/dewatermark/DetectionCard";
import { SegmentedControl } from "@/components/dewatermark/SegmentedControl";
import { SliderField } from "@/components/dewatermark/SliderField";
import { Toggle } from "@/components/dewatermark/Toggle";
import type {
  DewatermarkCornerChoice,
  DewatermarkExportFormat,
  DewatermarkImageMeta,
  DewatermarkSettings,
} from "@/hooks/use-dewatermark-workspace";
import type { WatermarkMetadata } from "@/lib/watermark-api";

const CORNER_OPTIONS: {
  id: DewatermarkCornerChoice;
  label: string;
}[] = [
  { id: "auto", label: "Auto" },
  { id: "tl", label: "TL" },
  { id: "tr", label: "TR" },
  { id: "bl", label: "BL" },
  { id: "br", label: "BR" },
];

const FORMAT_OPTIONS: {
  value: DewatermarkExportFormat;
  label: string;
}[] = [
  { value: "png", label: "PNG · lossless" },
  { value: "jpeg", label: "JPEG · smaller" },
  { value: "webp", label: "WebP · efficient" },
];

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

type DewatermarkSettingsRailProps = {
  hasImage: boolean;
  imageMeta: DewatermarkImageMeta | null;
  settings: DewatermarkSettings;
  detection: WatermarkMetadata | null;
  isProcessing: boolean;
  isDirty: boolean;
  onPatch: (patch: Partial<DewatermarkSettings>) => void;
  onReset: () => void;
  onUploadFile: (file: File) => void;
  onDownload: () => void;
};

export function DewatermarkSettingsRail({
  hasImage,
  imageMeta,
  settings,
  detection,
  isProcessing,
  isDirty,
  onPatch,
  onReset,
  onUploadFile,
  onDownload,
}: DewatermarkSettingsRailProps) {
  const disabled = isProcessing || !hasImage;

  return (
    <aside
      aria-label="Dewatermark settings"
      data-testid="dewatermark-settings-rail"
      className="flex w-90 shrink-0 flex-col border-l border-surface-border bg-surface-base"
    >
      <header className="shrink-0 border-b border-surface-border px-5 pt-4 pb-3">
        <p className="font-mono text-micro font-bold uppercase tracking-extra-wide text-accent-blue">
          Settings
        </p>
        <h2 className="mt-1 text-base font-bold tracking-display text-text-primary">
          Watermark removal
        </h2>
        <p className="mt-1 text-caption text-text-secondary">
          {hasImage
            ? "Tweak detection and repair. The result re-renders 250 ms after you stop."
            : "Upload an image to begin. All processing is local — nothing leaves your browser."}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pt-1">
        {hasImage && imageMeta ? (
          <RailSection eyebrow="Source">
            <div
              data-testid="rail-source-card"
              className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-raised p-3 font-mono text-caption"
            >
              <RailRow label="file">
                <span
                  data-testid="rail-source-file"
                  className="max-w-44 truncate text-text-primary"
                  title={imageMeta.name}
                >
                  {imageMeta.name}
                </span>
              </RailRow>
              <RailRow label="size">
                <span className="text-text-primary">
                  {imageMeta.width}×{imageMeta.height} ·{" "}
                  {formatBytes(imageMeta.size)}
                </span>
              </RailRow>
            </div>
          </RailSection>
        ) : null}

        <RailSection eyebrow="Detection">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-caption font-medium text-text-primary">
                Adaptive detect
              </span>
              <span className="text-caption text-text-tertiary">
                Scans the image when the official mask doesn&apos;t match.
              </span>
            </div>
            <Toggle
              ariaLabel="Adaptive detect"
              checked={settings.adaptive}
              disabled={disabled}
              onChange={(next) => onPatch({ adaptive: next })}
              testId="rail-toggle-adaptive"
            />
          </div>

          <div className="mt-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-caption font-medium text-text-primary">
                Corner
              </span>
              <button
                type="button"
                disabled={disabled || settings.corner === "auto"}
                onClick={() => onPatch({ corner: "auto" })}
                data-testid="rail-corner-auto-detect"
                className="rounded-xs px-1 py-0.5 text-caption text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                auto-detect
              </button>
            </div>
            <SegmentedControl
              ariaLabel="Watermark corner"
              options={CORNER_OPTIONS}
              value={settings.corner}
              disabled={disabled}
              onChange={(next) => onPatch({ corner: next })}
              testId="rail-corner-segmented"
            />
          </div>

          <div className="mt-3.5">
            <SliderField
              label="Confidence threshold"
              value={settings.confidenceThreshold}
              min={0}
              max={1}
              step={0.01}
              disabled={disabled}
              onChange={(v) => onPatch({ confidenceThreshold: v })}
              format={(v) => v.toFixed(2)}
              testId="rail-confidence"
            />
          </div>
        </RailSection>

        <RailSection
          eyebrow="Repair"
          rightSlot={
            <button
              type="button"
              disabled={!isDirty || disabled}
              onClick={onReset}
              data-testid="rail-reset-all"
              className="rounded-xs px-1 py-0.5 text-caption text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              reset all
            </button>
          }
        >
          <SliderField
            label="Alpha gain"
            value={settings.alphaGain}
            min={0.5}
            max={2}
            step={0.01}
            disabled={disabled}
            onChange={(v) => onPatch({ alphaGain: v })}
            format={(v) => `${v.toFixed(2)}×`}
            testId="rail-alpha-gain"
          />
        </RailSection>

        <RailSection eyebrow="Output">
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-medium text-text-primary">
              Format
            </span>
            <select
              aria-label="Output format"
              data-testid="rail-output-format"
              value={settings.exportFormat}
              disabled={disabled}
              onChange={(e) =>
                onPatch({
                  exportFormat: e.target.value as DewatermarkExportFormat,
                })
              }
              className="w-full rounded-md border border-surface-border bg-surface-raised px-2.5 py-2 font-mono text-caption text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </RailSection>

        {hasImage && detection ? (
          <RailSection eyebrow="Detection result">
            <DetectionCard
              corner={detection.corner}
              source={detection.source}
              alphaGain={detection.alphaGain}
              confidence={detection.confidence}
            />
          </RailSection>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-surface-border bg-surface-base px-5 py-3.5">
        {hasImage && imageMeta ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full justify-center"
            disabled={isProcessing}
            onClick={onDownload}
            data-testid="rail-download"
          >
            <Download className="size-3.5" aria-hidden="true" />
            {isProcessing ? "Rendering…" : "Download"}
          </Button>
        ) : (
          <RailUploadCta onFile={onUploadFile} />
        )}
      </footer>
    </aside>
  );
}

function RailUploadCta({ onFile }: { onFile: (file: File) => void }) {
  return (
    <label
      data-testid="rail-upload-label"
      className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-label font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
    >
      <Upload className="size-3.5" aria-hidden="true" />
      Upload image
      <input
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="rail-upload-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function RailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="tracking-wide text-text-tertiary">{label}</span>
      {children}
    </div>
  );
}

function RailSection({
  eyebrow,
  rightSlot,
  children,
}: {
  eyebrow: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-surface-border px-5 py-4.5 last:border-b-0">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="font-mono text-micro font-bold uppercase tracking-extra-wide text-text-tertiary">
          {eyebrow}
        </span>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}
