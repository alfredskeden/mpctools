"use client";

import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DewatermarkPreviewCell } from "@/components/dewatermark/DewatermarkPreviewCell";
import type {
  DewatermarkCornerChoice,
  DewatermarkImageMeta,
  DewatermarkSettings,
} from "@/hooks/use-dewatermark-workspace";
import type { WatermarkMetadata } from "@/lib/watermark-api";

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function resolveCornerForPreview(
  source: DewatermarkCornerChoice,
  detection: WatermarkMetadata | null,
): DewatermarkCornerChoice {
  if (source !== "auto") return source;
  if (!detection?.corner) return "br";
  switch (detection.corner) {
    case "top-left":
      return "tl";
    case "top-right":
      return "tr";
    case "bottom-left":
      return "bl";
    case "bottom-right":
      return "br";
    default:
      return "br";
  }
}

type DewatermarkPreviewPairProps = {
  imageMeta: DewatermarkImageMeta;
  originalSrc: string | null;
  resultSrc: string | null;
  draftSettings: DewatermarkSettings;
  committedSettings: DewatermarkSettings;
  detection: WatermarkMetadata | null;
  isProcessing: boolean;
  onClear: () => void;
  onDownload: () => void;
};

export function DewatermarkPreviewPair({
  imageMeta,
  originalSrc,
  resultSrc,
  draftSettings,
  committedSettings,
  detection,
  isProcessing,
  onClear,
  onDownload,
}: DewatermarkPreviewPairProps) {
  const draftCorner = resolveCornerForPreview(draftSettings.corner, null);
  const resultCorner = resolveCornerForPreview(
    committedSettings.corner,
    detection,
  );

  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border px-5">
        <div
          className="flex items-center gap-3 font-mono text-caption text-text-tertiary"
          data-testid="preview-file-meta"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-status-success shadow-[0_0_0_3px_rgba(34,197,94,0.12)]"
          />
          <span className="text-text-secondary">{imageMeta.name}</span>
          <span className="text-text-faint">·</span>
          <span>
            {imageMeta.width}×{imageMeta.height}
          </span>
          <span className="text-text-faint">·</span>
          <span>{formatBytes(imageMeta.size)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            data-testid="preview-replace"
          >
            <RefreshCcw className="size-3" aria-hidden="true" />
            Replace
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={isProcessing || !resultSrc}
            data-testid="preview-download"
          >
            <Download className="size-3" aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: "1fr 1px 1fr" }}
        data-testid="preview-grid"
      >
        <DewatermarkPreviewCell
          label="Original"
          rightSlot={
            <span className="rounded-xs bg-surface-raised px-1.5 py-px text-text-secondary">
              with watermark
            </span>
          }
          imageSrc={originalSrc}
          imageWidth={imageMeta.width}
          imageHeight={imageMeta.height}
          resolvedCorner={draftCorner}
          variant="original"
          testId="preview-cell-original"
        />
        <div
          aria-hidden="true"
          className="bg-surface-border"
          data-testid="preview-divider"
        />
        <DewatermarkPreviewCell
          label="Result"
          rightSlot={
            <span
              className={
                isProcessing
                  ? "rounded-xs bg-surface-raised px-1.5 py-px text-text-secondary"
                  : "rounded-xs bg-status-success/10 px-1.5 py-px text-status-success"
              }
            >
              {isProcessing ? "rendering" : "watermark removed"}
            </span>
          }
          imageSrc={resultSrc}
          imageWidth={imageMeta.width}
          imageHeight={imageMeta.height}
          resolvedCorner={resultCorner}
          variant="result"
          isProcessing={isProcessing}
          detectionMeta={
            detection
              ? { corner: detection.corner, confidence: detection.confidence }
              : null
          }
          testId="preview-cell-result"
        />
      </div>
    </>
  );
}
