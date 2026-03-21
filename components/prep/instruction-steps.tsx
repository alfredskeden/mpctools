"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { StepStatus, PrepState, Algorithm, VerticalPreset } from "@/hooks/use-prep-workflow";
import { StepCircle } from "@/components/ui/StepCircle";
import {
  MobileInstructionCarousel,
  type CarouselStep,
} from "@/components/ui/mobile-instruction-carousel";
import { ControlsPanel } from "./controls-panel";
import { MobileAdvancedOptions } from "./toolbar/MobileAdvancedOptions";

type InstructionStepsProps = {
  stepStatuses: readonly StepStatus[];
  state: PrepState;
  onUploadImage: (
    dataUrl: string,
    element: HTMLImageElement,
    fileName: string,
  ) => void;
  onToggleOverlay: (overlay: string) => void;
  onUpdateScale: (scale: number) => void;
  onUpdateRotation: (rotation: number) => void;
  onMarkPositioned: () => void;
  onReposition: () => void;
  prepAction: React.ReactNode;
  onUpdatePosition: (x: number, y: number) => void;
  onSetOverlayOpacity: (id: string, opacity: number) => void;
  onSetCanvasSize: (width: number, height: number) => void;
  onSetDpiOverride: (dpi: number | null) => void;
  onSetKeepAspectRatio: (keep: boolean) => void;
  onSetAlgorithm: (algorithm: Algorithm) => void;
  onSetImageDimensions: (width: number, height: number) => void;
  onCenterHorizontal: () => void;
  onCenterVertical: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onSetVerticalPreset: (preset: VerticalPreset) => void;
};

export const InstructionSteps = ({
  stepStatuses,
  state,
  onUploadImage,
  onToggleOverlay,
  onUpdateScale,
  onUpdateRotation,
  onMarkPositioned,
  onReposition,
  prepAction,
  onUpdatePosition,
  onSetOverlayOpacity,
  onSetCanvasSize,
  onSetDpiOverride,
  onSetKeepAspectRatio,
  onSetAlgorithm,
  onSetImageDimensions,
  onCenterHorizontal,
  onCenterVertical,
  onFitWidth,
  onFitHeight,
  onSetVerticalPreset,
}: InstructionStepsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const fileName = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => onUploadImage(dataUrl, img, fileName);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onUploadImage],
  );

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const step1Status = stepStatuses[0];
  const step2Status = stepStatuses[1];
  const step3Status = stepStatuses[2];

  const mobileSteps: CarouselStep[] = [
    {
      number: 1,
      title: "Upload your card art",
      status: step1Status,
      content: (
        <>
          {step1Status === "active" && (
            <>
              <p className="text-xs leading-normal text-text-secondary">
                Upload your card scan from Scryfall or browse your files.
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-accent-blue text-sm font-medium text-white"
              >
                <Upload className="size-3.5" />
                Upload Now
              </button>
            </>
          )}
          {step1Status === "completed" && (
            <div className="flex items-center justify-between">
              <p className="text-xs leading-normal text-text-secondary">
                {state.fileName} uploaded
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-surface-subtle px-2.5 text-xs text-text-secondary"
              >
                <Upload className="size-2.5" />
                Change
              </button>
            </div>
          )}
        </>
      ),
    },
    {
      number: 2,
      title: "Position & frame",
      status: step2Status,
      content: (
        <>
          {step2Status === "active" && (
            <>
              <p className="text-xs leading-normal text-text-secondary">
                Resize, position your art and select the overlay frame.
              </p>
              <div className="mt-3">
                <ControlsPanel
                  scale={state.scale}
                  selectedOverlays={state.selectedOverlays}
                  rotation={state.rotation}
                  onUpdateScale={onUpdateScale}
                  onToggleOverlay={onToggleOverlay}
                  onUpdateRotation={onUpdateRotation}
                />
              </div>
              <MobileAdvancedOptions
                state={state}
                onUpdatePosition={onUpdatePosition}
                onUpdateScale={onUpdateScale}
                onUpdateRotation={onUpdateRotation}
                onToggleOverlay={onToggleOverlay}
                onSetOverlayOpacity={onSetOverlayOpacity}
                onSetCanvasSize={onSetCanvasSize}
                onSetDpiOverride={onSetDpiOverride}
                onSetKeepAspectRatio={onSetKeepAspectRatio}
                onSetAlgorithm={onSetAlgorithm}
                onSetImageDimensions={onSetImageDimensions}
                onCenterHorizontal={onCenterHorizontal}
                onCenterVertical={onCenterVertical}
                onFitWidth={onFitWidth}
                onFitHeight={onFitHeight}
                onSetVerticalPreset={onSetVerticalPreset}
              />
              <button
                type="button"
                onClick={onMarkPositioned}
                className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-status-success-dark text-sm font-medium text-white"
              >
                I&apos;m Done
              </button>
            </>
          )}
          {step2Status === "completed" && (
            <div className="flex items-center justify-between">
              <p className="text-xs leading-normal text-text-secondary">
                Positioned and framed
              </p>
              <button
                type="button"
                onClick={onReposition}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-surface-subtle px-2.5 text-xs text-text-secondary"
              >
                Reposition again
              </button>
            </div>
          )}
        </>
      ),
    },
    {
      number: 3,
      title: "Download prepared image",
      status: step3Status,
      content: (
        <>
          {step3Status === "upcoming" && (
            <p className="text-xs leading-normal text-text-tertiary">
              Export your positioned card as a PNG for Gemini outpainting.
            </p>
          )}
          {step3Status === "active" && (
            <p className="text-xs leading-normal text-text-secondary">
              Your PNG is ready. Download it or continue to outpainting.
            </p>
          )}
          {prepAction}
        </>
      ),
    },
  ];

  return (
    <aside aria-label="Instructions">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="file-input"
      />

      {/* Mobile carousel */}
      <MobileInstructionCarousel
        steps={mobileSteps}
        currentStepIndex={state.currentStep - 1}
      />

      {/* Desktop stacked layout */}
      <div className="hidden md:flex md:flex-col md:gap-7">
        {/* Step 1 — Upload your card art */}
        <div
          className={cn(
            "flex flex-col gap-3",
            step1Status === "upcoming" && "opacity-35",
          )}
        >
          <div className="flex items-center gap-2.5">
            <StepCircle status={step1Status} number={1} />
            <p
              className={cn(
                "text-sm font-medium leading-6",
                step1Status === "upcoming"
                  ? "text-text-secondary"
                  : "text-text-primary",
              )}
            >
              Upload your card art
            </p>
          </div>

          {step1Status === "active" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                Upload your card scan from Scryfall or browse your files.
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="ml-8.5 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-blue text-sm font-medium text-white"
              >
                <Upload className="size-3.5" />
                Upload Now
              </button>
            </>
          )}

          {step1Status === "completed" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                {state.fileName} uploaded
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="ml-8.5 flex h-8 items-center justify-center gap-1.5 rounded-md border border-surface-subtle text-sm text-text-secondary"
              >
                <Upload className="size-3" />
                Change Image
              </button>
            </>
          )}
        </div>

        {/* Step 2 — Position & frame */}
        <div
          className={cn(
            "flex flex-col gap-3",
            step2Status === "upcoming" && "opacity-35",
          )}
        >
          <div className="flex items-center gap-2.5">
            <StepCircle status={step2Status} number={2} />
            <p
              className={cn(
                "text-sm font-medium leading-6",
                step2Status === "upcoming"
                  ? "text-text-secondary"
                  : "text-text-primary",
              )}
            >
              Position & frame
            </p>
          </div>

          {step2Status === "active" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                Resize, position your art and select the overlay frame.
              </p>
              <ControlsPanel
                scale={state.scale}
                selectedOverlays={state.selectedOverlays}
                rotation={state.rotation}
                onUpdateScale={onUpdateScale}
                onToggleOverlay={onToggleOverlay}
                onUpdateRotation={onUpdateRotation}
              />
              <button
                type="button"
                onClick={onMarkPositioned}
                className="ml-8.5 mt-2 flex h-9 items-center justify-center rounded-lg bg-status-success-dark text-sm font-medium text-white"
              >
                I&apos;m Done
              </button>
            </>
          )}

          {step2Status === "completed" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                Positioned and framed
              </p>
              <button
                type="button"
                onClick={onReposition}
                className="ml-8.5 flex h-8 items-center justify-center gap-1.5 rounded-md border border-surface-subtle text-sm text-text-secondary"
              >
                Reposition again
              </button>
            </>
          )}
        </div>

        {/* Step 3 — Download prepared image */}
        <div
          className={cn(
            "flex flex-col gap-3",
            step3Status === "upcoming" && "opacity-35",
          )}
        >
          <div className="flex items-center gap-2.5">
            <StepCircle status={step3Status} number={3} />
            <p
              className={cn(
                "text-sm font-medium leading-6",
                step3Status === "upcoming"
                  ? "text-text-secondary"
                  : "text-text-primary",
              )}
            >
              Download prepared image
            </p>
          </div>

          {step3Status === "upcoming" && (
            <p className="pl-8.5 text-xs leading-normal text-text-tertiary">
              Export your positioned card as a PNG for Gemini outpainting.
            </p>
          )}

          {step3Status === "active" && (
            <p className="pl-8.5 text-xs leading-normal text-text-secondary">
              Your PNG is ready. Download it or continue to outpainting.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
