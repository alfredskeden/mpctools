"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DewatermarkCornerChoice } from "@/hooks/use-dewatermark-workspace";

type DewatermarkPreviewCellProps = {
  label: string;
  rightSlot?: React.ReactNode;
  imageSrc: string | null;
  imageWidth: number;
  imageHeight: number;
  resolvedCorner: DewatermarkCornerChoice;
  variant: "original" | "result";
  isProcessing?: boolean;
  detectionMeta?: { corner: string; confidence: number } | null;
  testId?: string;
};

export function fitDisplaySize(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
) {
  if (!containerW || !containerH || !imageW || !imageH) return { w: 0, h: 0 };
  const ratio = imageW / imageH;
  let w = containerW;
  let h = containerW / ratio;
  if (h > containerH) {
    h = containerH;
    w = containerH * ratio;
  }
  return { w: Math.max(20, Math.floor(w)), h: Math.max(20, Math.floor(h)) };
}

function cornerRect(
  corner: DewatermarkCornerChoice,
  w: number,
  h: number,
) {
  const wmW = w * 0.18;
  const wmH = h * 0.06;
  const margin = 10;
  const resolved: Exclude<DewatermarkCornerChoice, "auto"> =
    corner === "auto" ? "br" : corner;
  switch (resolved) {
    case "tl":
      return { x: margin, y: margin, w: wmW, h: wmH };
    case "tr":
      return { x: w - wmW - margin, y: margin, w: wmW, h: wmH };
    case "bl":
      return { x: margin, y: h - wmH - margin, w: wmW, h: wmH };
    case "br":
    default:
      return { x: w - wmW - margin, y: h - wmH - margin, w: wmW, h: wmH };
  }
}

export function DewatermarkPreviewCell({
  label,
  rightSlot,
  imageSrc,
  imageWidth,
  imageHeight,
  resolvedCorner,
  variant,
  isProcessing,
  detectionMeta,
  testId,
}: DewatermarkPreviewCellProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    /* v8 ignore start -- stageRef populated via React ref in DOM */
    if (!stage) return;
    /* v8 ignore stop */
    const recalc = () => {
      const r = stage.getBoundingClientRect();
      setSize(fitDisplaySize(r.width - 4, r.height - 4, imageWidth, imageHeight));
    };
    recalc();
    /* v8 ignore start -- jsdom always defines ResizeObserver via test setup */
    if (typeof ResizeObserver === "undefined") return;
    /* v8 ignore stop */
    const ro = new ResizeObserver(recalc);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [imageWidth, imageHeight]);

  const overlay =
    size.w > 0 && size.h > 0
      ? cornerRect(resolvedCorner, size.w, size.h)
      : null;
  // Fixed framing pad for the watermark-region indicator overlays.
  const expandPx = 4;

  return (
    <section
      data-testid={testId}
      data-variant={variant}
      className="relative flex min-h-0 min-w-0 flex-col"
    >
      <header className="flex shrink-0 items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-micro uppercase tracking-extra-wide text-text-tertiary">
          <span>{label}</span>
          {rightSlot}
        </div>
        {variant === "result" && detectionMeta ? (
          <div
            className="flex gap-2.5 font-mono text-micro text-text-tertiary"
            data-testid="preview-meta-mini"
          >
            <span data-testid="preview-meta-corner">
              corner{" "}
              <span className="text-text-secondary">
                {detectionMeta.corner ? detectionMeta.corner.toUpperCase() : "—"}
              </span>
            </span>
            <span data-testid="preview-meta-confidence">
              conf{" "}
              <span className="text-text-secondary">
                {detectionMeta.confidence.toFixed(2)}
              </span>
            </span>
          </div>
        ) : null}
      </header>
      <div
        ref={stageRef}
        className="relative flex flex-1 items-center justify-center px-4 pt-3 pb-7"
      >
        <div
          className="relative flex overflow-hidden rounded-sm bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
          style={{ width: size.w, height: size.h }}
        >
          {imageSrc ? (
            <img
              ref={imgRef}
              src={imageSrc}
              alt={`${label} preview`}
              data-testid={testId ? `${testId}-image` : undefined}
              className="block max-h-full max-w-full object-contain"
              style={{ width: size.w, height: size.h }}
            />
          ) : null}
          {overlay && variant === "original" ? (
            <span
              data-testid="detection-ring"
              className="pointer-events-none absolute rounded-xs border-1.5 border-dashed border-accent-blue shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
              style={{
                left: overlay.x - expandPx,
                top: overlay.y - expandPx,
                width: overlay.w + expandPx * 2,
                height: overlay.h + expandPx * 2,
              }}
            />
          ) : null}
          {overlay && variant === "result" ? (
            <span
              data-testid="repair-mask"
              className="pointer-events-none absolute rounded-xs border border-status-success/40 bg-status-success/5"
              style={{
                left: overlay.x - expandPx,
                top: overlay.y - expandPx,
                width: overlay.w + expandPx * 2,
                height: overlay.h + expandPx * 2,
              }}
            />
          ) : null}
          {variant === "result" ? (
            <div
              data-testid="render-overlay"
              data-active={isProcessing ? "true" : "false"}
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center",
                "bg-surface-ground/55 backdrop-blur-[2px] transition-opacity",
                isProcessing ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised px-2.5 py-1.5 font-mono text-caption tracking-wide text-text-secondary">
                <Loader2
                  data-testid="render-spinner"
                  className="size-3 animate-spin text-accent-blue"
                />
                <span>RENDERING…</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
