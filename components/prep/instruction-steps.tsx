"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";
import type { StepStatus, PrepState } from "@/hooks/use-prep-workflow";
import { ControlsPanel } from "./controls-panel";

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
};

function StepCircle({
  status,
  number,
}: {
  status: StepStatus;
  number: number;
}) {
  if (status === "completed") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-status-success-dark">
        <Check className="size-3 text-white" strokeWidth={3} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
        status === "active" && "bg-accent-blue text-white",
        status === "upcoming" &&
          "border border-surface-muted bg-transparent text-text-tertiary",
      )}
    >
      {number}
    </div>
  );
}

export function InstructionSteps({
  stepStatuses,
  state,
  onUploadImage,
  onToggleOverlay,
  onUpdateScale,
  onUpdateRotation,
  onMarkPositioned,
}: InstructionStepsProps) {
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

      <div className="flex flex-col gap-7">
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
            {step1Status === "completed" && (
              <button
                type="button"
                onClick={handleUploadClick}
                className="ml-auto flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-surface-subtle px-2.5 text-xs text-text-secondary md:hidden"
              >
                <Upload className="size-2.5" />
                Change
              </button>
            )}
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
                className="ml-8.5 hidden h-8 items-center justify-center gap-1.5 rounded-md border border-surface-subtle text-sm text-text-secondary md:flex"
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
            <p className="pl-8.5 text-xs leading-normal text-text-secondary">
              Positioned and framed
            </p>
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
}
