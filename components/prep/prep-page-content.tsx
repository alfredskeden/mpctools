"use client";

import { useCallback } from "react";
import { usePrepWorkflow } from "@/hooks/use-prep-workflow";
import { InstructionSteps } from "./instruction-steps";
import { PrepActions } from "./prep-actions";
import { TransformCanvas } from "./TransformCanvas";
export function PrepPageContent() {
  const {
    state,
    uploadImage,
    updatePosition,
    updateScale,
    updateRotation,
    markPositioned,
    markDownloaded,
    setCanvasDataUrl,
    selectOverlay,
    canDownload,
    canContinue,
    stepStatuses,
  } = usePrepWorkflow();

  const handleDownload = useCallback(() => {
    /* v8 ignore start */
    if (!state.canvasDataUrl) return;
    /* v8 ignore stop */

    const link = document.createElement("a");
    /* v8 ignore start */
    const baseName = state.fileName?.replace(/\.[^.]+$/, "") ?? "card";
    /* v8 ignore stop */
    link.download = `outpaint_${baseName}.png`;
    link.href = state.canvasDataUrl;
    link.click();
    markDownloaded();
  }, [state.canvasDataUrl, state.fileName, markDownloaded]);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Canvas area */}
      <div className="flex min-h-7/12 flex-1 items-center justify-center bg-surface-ground p-4 md:min-h-0 md:p-6">
        <TransformCanvas
          image={state.imageElement}
          selectedOverlay={state.selectedOverlay}
          scale={state.scale}
          position={state.position}
          rotation={state.rotation}
          onPositionChange={updatePosition}
          onScaleChange={updateScale}
          onRotationChange={updateRotation}
          onExport={setCanvasDataUrl}
        />
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col overflow-y-auto border-t border-surface-border bg-surface-raised p-5 md:w-80 md:shrink-0 md:overflow-visible md:border-l md:border-t-0">
        <div className="flex-1">
          <InstructionSteps
            stepStatuses={stepStatuses}
            state={state}
            onUploadImage={uploadImage}
            onSelectOverlay={selectOverlay}
            onUpdateScale={updateScale}
            onUpdateRotation={updateRotation}
            onMarkPositioned={markPositioned}
          />
        </div>

        <div className="mt-6">
          <PrepActions
            canDownload={canDownload}
            canContinue={canContinue}
            isDownloaded={state.isDownloaded}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
}
