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
    <div className="flex h-svh flex-col">
      <PrepHeader stepStatuses={stepStatuses} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Canvas area */}
        <div className="flex flex-1 items-center justify-center bg-surface-ground p-6">
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

        {/* Right panel */}
        <div className="flex w-full shrink-0 flex-col border-t border-surface-border bg-surface-raised p-5 md:w-80 md:border-l md:border-t-0">
          <div className="flex-1">
            <InstructionSteps stepStatuses={stepStatuses} />
            {state.imageElement && (
              <div className="mt-6">
                <OverlaySelector
                  selectedOverlay={state.selectedOverlay}
                  onSelectOverlay={selectOverlay}
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <PrepActions
              canDownload={canDownload}
              canContinue={canContinue}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
