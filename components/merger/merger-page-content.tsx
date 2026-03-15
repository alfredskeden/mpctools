"use client";

import { useCallback, useRef } from "react";
import { useMergerWorkflow } from "@/hooks/use-merger-workflow";
import { MergerSteps } from "./merger-steps";
import { MergerActions } from "./merger-actions";
import { MergerCanvas } from "./MergerCanvas";
import { downloadCanvasAsBlob } from "@/lib/merger-utils";

export function MergerPageContent() {
  const {
    state,
    uploadOg,
    uploadGuide,
    uploadOutpaint,
    setFeather,
    markDownloaded,
    canDownload,
    stepStatuses,
  } = useMergerWorkflow();

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    /* v8 ignore start */
    if (!canDownload) return;
    /* v8 ignore stop */

    const canvas = canvasContainerRef.current?.querySelector("canvas");
    /* v8 ignore start */
    if (!canvas) return;
    /* v8 ignore stop */

    /* v8 ignore start */
    const baseName = state.ogFileName?.replace(/\.[^.]+$/, "") ?? "card";
    /* v8 ignore stop */
    downloadCanvasAsBlob(canvas, `merged_${baseName}.png`);
    markDownloaded();
  }, [canDownload, state.ogFileName, markDownloaded]);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Canvas area */}
      <div
        ref={canvasContainerRef}
        className="flex min-h-7/12 flex-1 items-center justify-center bg-surface-ground p-4 md:min-h-0 md:p-6"
      >
        <MergerCanvas state={state} />
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col overflow-y-auto border-t border-surface-border bg-surface-raised p-5 md:w-80 md:shrink-0 md:overflow-visible md:border-l md:border-t-0">
        <div className="flex-1">
          <MergerSteps
            stepStatuses={stepStatuses}
            state={state}
            onUploadOg={uploadOg}
            onUploadGuide={uploadGuide}
            onUploadOutpaint={uploadOutpaint}
          />
        </div>

        <div className="mt-6">
          <MergerActions
            canDownload={canDownload}
            isDownloaded={state.isDownloaded}
            featherStrength={state.featherStrength}
            onDownload={handleDownload}
            onFeatherChange={setFeather}
          />
        </div>
      </div>
    </div>
  );
}
