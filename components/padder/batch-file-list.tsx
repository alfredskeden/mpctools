"use client";

import type { BatchRow } from "@/hooks/use-padder-batch";

type BatchCounts = {
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
};

type BatchProgress = {
  processed: number;
  total: number;
  current: string;
};

type BatchFileListProps = {
  rows: BatchRow[];
  counts: BatchCounts;
  progress: BatchProgress;
  isRunning: boolean;
};

export function BatchFileList({
  rows,
  counts,
  progress,
  isRunning,
}: BatchFileListProps) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {isRunning && (
        <p
          data-testid="batch-progress"
          data-processed={progress.processed}
          data-total={progress.total}
          className="text-xs text-text-secondary"
        >
          Processing {progress.processed} / {progress.total} — {progress.current}
        </p>
      )}

      <ul role="list" data-testid="batch-file-list" className="flex flex-col gap-1">
        {rows.map((row, index) => (
          <li
            key={`${row.name}-${index}`}
            role="listitem"
            data-testid="batch-row"
            data-status={row.status}
            data-reason={row.reason ?? ""}
            className="flex items-center justify-between gap-2 rounded-lg border border-surface-border bg-surface-base p-2 text-xs"
          >
            <span className="truncate text-text-primary">{row.name}</span>
            <span data-testid="batch-row-size" className="font-mono text-text-tertiary">
              {row.size}
            </span>
            {row.canvasWidth !== undefined && row.canvasHeight !== undefined && (
              <span data-testid="batch-row-canvas" className="font-mono text-text-secondary">
                {row.canvasWidth}
                {" x "}
                {row.canvasHeight}
              </span>
            )}
            {row.cropPixels !== undefined && row.cropPixels > 0 && (
              <span data-testid="batch-row-crop" className="font-mono text-text-secondary">
                {row.cropPixels}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div
        data-testid="batch-summary"
        data-total={counts.total}
        data-succeeded={counts.succeeded}
        data-failed={counts.failed}
        data-pending={counts.pending}
        className="text-xs text-text-secondary"
      >
        {counts.succeeded} ready · {counts.failed} failed · {counts.pending} pending
      </div>
    </div>
  );
}
