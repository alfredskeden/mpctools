"use client";

import { usePadderBatch } from "@/hooks/use-padder-batch";
import type { PadTarget } from "@/lib/padder-math";
import { BatchDropZone } from "./batch-drop-zone";
import { BatchFileList } from "./batch-file-list";
import { BatchActions } from "./batch-actions";

type PadderBatchContentProps = {
  target: PadTarget;
};

export function PadderBatchContent({ target }: PadderBatchContentProps) {
  const batch = usePadderBatch(target);

  return (
    <div className="flex flex-col gap-4" data-testid="padder-batch-content">
      <BatchDropZone onFiles={batch.addFiles} disabled={batch.isRunning} />
      <BatchFileList
        rows={batch.rows}
        counts={batch.counts}
        progress={batch.progress}
        isRunning={batch.isRunning}
      />
      <BatchActions
        canRun={batch.canRun}
        isRunning={batch.isRunning}
        canDownload={batch.canDownload}
        onRun={batch.run}
        onCancel={batch.cancel}
        onDownload={batch.download}
      />
    </div>
  );
}
