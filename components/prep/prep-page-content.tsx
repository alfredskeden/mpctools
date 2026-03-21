"use client";

import { useCallback } from "react";
import { usePrepWorkflow } from "@/hooks/use-prep-workflow";
import { exportFullResolution } from "@/lib/prep-renderer";
import { InstructionSteps } from "./instruction-steps";
import { PrepActions } from "./prep-actions";
import { TransformCanvas } from "./TransformCanvas";
import { PrepToolbar } from "./toolbar/PrepToolbar";
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
    toggleOverlay,
    resetWorkflow,
    setCanvasSize,
    setDpiOverride,
    setOverlayOpacity,
    setKeepAspectRatio,
    setAlgorithm,
    setImageDimensions,
    centerHorizontal,
    centerVertical,
    fitWidth,
    fitHeight,
    setVerticalPreset,
    setOverlayNativeDimensions,
    canDownload,
    canContinue,
    stepStatuses,
  } = usePrepWorkflow();

  const handleDownload = useCallback(() => {
    /* v8 ignore start */
    if (!state.imageElement) return;
    /* v8 ignore stop */

    const fullResDataUrl = exportFullResolution(
      state.imageElement,
      state.position,
      state.scale,
      state.rotation,
      state.canvasWidth,
      state.canvasHeight,
    );
    /* v8 ignore start */
    if (!fullResDataUrl) return;
    /* v8 ignore stop */

    const link = document.createElement("a");
    /* v8 ignore start */
    const baseName = state.fileName?.replace(/\.[^.]+$/, "") ?? "card";
    /* v8 ignore stop */
    link.download = `outpaint_${baseName}.png`;
    link.href = fullResDataUrl;
    link.click();
    markDownloaded();
  }, [state.imageElement, state.position, state.scale, state.rotation, state.fileName, state.canvasWidth, state.canvasHeight, markDownloaded]);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Canvas area */}
      <div className="relative flex min-h-7/12 flex-1 items-center justify-center bg-surface-ground p-4 md:min-h-0 md:p-6">
        <PrepToolbar
          disabled={state.currentStep < 2}
          state={state}
          onUpdatePosition={updatePosition}
          onUpdateScale={updateScale}
          onUpdateRotation={updateRotation}
          onToggleOverlay={toggleOverlay}
          onSetOverlayOpacity={setOverlayOpacity}
          onSetCanvasSize={setCanvasSize}
          onSetDpiOverride={setDpiOverride}
          onSetKeepAspectRatio={setKeepAspectRatio}
          onSetAlgorithm={setAlgorithm}
          onSetImageDimensions={setImageDimensions}
          onCenterHorizontal={centerHorizontal}
          onCenterVertical={centerVertical}
          onFitWidth={fitWidth}
          onFitHeight={fitHeight}
          onSetVerticalPreset={setVerticalPreset}
        />
        <TransformCanvas
          image={state.imageElement}
          selectedOverlays={state.selectedOverlays}
          overlayOpacities={state.overlayOpacities}
          canvasWidth={state.canvasWidth}
          canvasHeight={state.canvasHeight}
          scale={state.scale}
          position={state.position}
          rotation={state.rotation}
          onPositionChange={updatePosition}
          onScaleChange={updateScale}
          onRotationChange={updateRotation}
          onExport={setCanvasDataUrl}
          onOverlayNativeDimensions={setOverlayNativeDimensions}
        />
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col overflow-y-auto border-t border-surface-border bg-surface-raised p-5 md:w-80 md:shrink-0 md:overflow-visible md:border-l md:border-t-0">
        <div className="flex-1">
          <InstructionSteps
            stepStatuses={stepStatuses}
            state={state}
            onUploadImage={uploadImage}
            onToggleOverlay={toggleOverlay}
            onUpdateScale={updateScale}
            onUpdateRotation={updateRotation}
            onMarkPositioned={markPositioned}
            onReposition={resetWorkflow}
            onUpdatePosition={updatePosition}
            onSetOverlayOpacity={setOverlayOpacity}
            onSetCanvasSize={setCanvasSize}
            onSetDpiOverride={setDpiOverride}
            onSetKeepAspectRatio={setKeepAspectRatio}
            onSetAlgorithm={setAlgorithm}
            onSetImageDimensions={setImageDimensions}
            onCenterHorizontal={centerHorizontal}
            onCenterVertical={centerVertical}
            onFitWidth={fitWidth}
            onFitHeight={fitHeight}
            onSetVerticalPreset={setVerticalPreset}
            prepAction={
              <PrepActions
                canDownload={canDownload}
                canContinue={canContinue}
                isDownloaded={state.isDownloaded}
                onDownload={handleDownload}
              />
            }
          />
        </div>

        <div className="hidden md:block mt-6">
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
