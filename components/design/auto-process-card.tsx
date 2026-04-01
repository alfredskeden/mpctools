"use client";

import { Loader2, Check } from "lucide-react";

type AutoProcessCardProps = {
  isProcessing: boolean;
  grayBorderDataUrl: string | null;
  fileName: string | null;
};

export function AutoProcessCard({
  isProcessing,
  grayBorderDataUrl,
  fileName,
}: AutoProcessCardProps) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-4">
        <Loader2
          className="size-5 shrink-0 animate-spin text-accent-blue"
          data-testid="processing-spinner"
        />
        <span className="text-sm text-text-secondary">
          Generating outpaint canvas...
        </span>
      </div>
    );
  }

  if (!grayBorderDataUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-5 items-center justify-center rounded-full bg-status-success-dark">
          <Check className="size-3 text-white" strokeWidth={3} />
        </div>
        <span className="text-label font-semibold tracking-wide text-text-primary">
          Outpaint canvas generated
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={grayBorderDataUrl}
          alt="Generated outpaint canvas"
          className="h-20 w-auto rounded border border-surface-border"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-text-primary">
            {fileName ?? "outpaint-canvas.png"}
          </span>
          <span className="text-caption text-text-tertiary">3520 x 4800</span>
        </div>
      </div>
    </div>
  );
}
