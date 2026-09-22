"use client";

import { Download, X, Play } from "lucide-react";

type BatchActionsProps = {
  canRun: boolean;
  isRunning: boolean;
  canDownload: boolean;
  onRun: () => void;
  onCancel: () => void;
  onDownload: () => void;
};

export function BatchActions({
  canRun,
  isRunning,
  canDownload,
  onRun,
  onCancel,
  onDownload,
}: BatchActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {isRunning ? (
        <button
          type="button"
          data-testid="batch-cancel-btn"
          onClick={onCancel}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-sm font-medium text-text-primary"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      ) : (
        <button
          type="button"
          data-testid="batch-run-btn"
          disabled={!canRun}
          onClick={onRun}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-blue text-sm font-medium text-white disabled:opacity-50"
        >
          <Play className="size-3.5" />
          Pad all
        </button>
      )}

      <button
        type="button"
        data-testid="batch-download-btn"
        disabled={!canDownload}
        onClick={onDownload}
        className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-sm font-medium text-text-primary disabled:opacity-50"
      >
        <Download className="size-3.5" />
        Download ZIP
      </button>
    </div>
  );
}
