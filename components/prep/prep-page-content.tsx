"use client";

import { useCallback } from "react";
import { usePrepWorkflow } from "@/hooks/use-prep-workflow";
import { PrepHeader } from "./prep-header";
import { ImageDropZone } from "./image-drop-zone";
import { PrepCanvas } from "./prep-canvas";
import { InstructionSteps } from "./instruction-steps";
import { PrepActions } from "./prep-actions";
import { OverlaySelector } from "./overlay-selector";

export function PrepPageContent() {
  const {
    state,
    uploadImage,
    updatePosition,
    updateScale,
    markPositioned,
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
    link.download = "prepared-card.png";
    link.href = state.canvasDataUrl;
    link.click();
  }, [state.canvasDataUrl]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <PrepHeader stepStatuses={stepStatuses} />

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="min-h-[400px]">
          {state.imageElement ? (
            <PrepCanvas
              imageElement={state.imageElement}
              position={state.position}
              scale={state.scale}
              onPositionChange={updatePosition}
              onScaleChange={updateScale}
              onMarkPositioned={markPositioned}
              onCanvasDataUrl={setCanvasDataUrl}
              selectedOverlay={state.selectedOverlay}
            />
          ) : (
            <ImageDropZone onImageLoad={uploadImage} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <InstructionSteps stepStatuses={stepStatuses} />
          {state.imageElement && (
            <OverlaySelector
              selectedOverlay={state.selectedOverlay}
              onSelectOverlay={selectOverlay}
            />
          )}
        </div>
      </div>

      <PrepActions
        canDownload={canDownload}
        canContinue={canContinue}
        onDownload={handleDownload}
      />
    </div>
  );
}
