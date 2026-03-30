"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { StepStatus, MergerState } from "@/hooks/use-merger-workflow";
import { StepCircle } from "@/components/ui/StepCircle";
import {
  MobileInstructionCarousel,
  type CarouselStep,
} from "@/components/ui/mobile-instruction-carousel";
import { DewatermarkDialog } from "@/components/merger/dewatermark-dialog";

type MergerStepsProps = {
  stepStatuses: readonly StepStatus[];
  state: MergerState;
  onUploadOg: (
    image: HTMLImageElement,
    fileName: string,
    fileSize: number,
  ) => void;
  onUploadGuide: (
    image: HTMLImageElement,
    fileName: string,
    fileSize: number,
    guideCanvas: HTMLCanvasElement,
  ) => void;
  onUploadOutpaint: (
    image: HTMLImageElement,
    fileName: string,
    fileSize: number,
  ) => void;
  mergerAction: React.ReactNode;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const useFileUpload = (
  onLoad: (
    image: HTMLImageElement,
    fileName: string,
    fileSize: number,
    guideCanvas?: HTMLCanvasElement,
  ) => void,
  createGuideCanvas?: boolean,
) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const fileName = file.name;
      const fileSize = file.size;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          if (createGuideCanvas) {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            onLoad(img, fileName, fileSize, canvas);
          } else {
            onLoad(img, fileName, fileSize);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be re-uploaded
      e.target.value = "";
    },
    [onLoad, createGuideCanvas],
  );

  const triggerUpload = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return { inputRef, handleFileChange, triggerUpload };
};

export const MergerSteps = ({
  stepStatuses,
  state,
  onUploadOg,
  onUploadGuide,
  onUploadOutpaint,
  mergerAction,
}: MergerStepsProps) => {
  const {
    inputRef: ogInputRef,
    handleFileChange: ogHandleFileChange,
    triggerUpload: ogTriggerUpload,
  } = useFileUpload(
    useCallback(
      (img: HTMLImageElement, name: string, size: number) =>
        onUploadOg(img, name, size),
      [onUploadOg],
    ),
  );

  const {
    inputRef: guideInputRef,
    handleFileChange: guideHandleFileChange,
    triggerUpload: guideTriggerUpload,
  } = useFileUpload(
    useCallback(
      (
        img: HTMLImageElement,
        name: string,
        size: number,
        canvas?: HTMLCanvasElement,
      ) => onUploadGuide(img, name, size, canvas!),
      [onUploadGuide],
    ),
    true,
  );

  const {
    inputRef: outpaintInputRef,
    handleFileChange: outpaintHandleFileChange,
    triggerUpload: outpaintTriggerUpload,
  } = useFileUpload(
    useCallback(
      (img: HTMLImageElement, name: string, size: number) =>
        onUploadOutpaint(img, name, size),
      [onUploadOutpaint],
    ),
  );

  const step1Status = stepStatuses[0];
  const step2Status = stepStatuses[1];
  const step3Status = stepStatuses[2];

  const mobileSteps: CarouselStep[] = [
    {
      number: 1,
      title: "Upload the original art",
      status: step1Status,
      content: (
        <>
          {step1Status === "active" && (
            <>
              <p className="text-xs leading-normal text-text-secondary">
                The original art without gray border from prep step.
              </p>
              <button
                type="button"
                onClick={ogTriggerUpload}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </>
          )}
          {step1Status === "completed" && (
            <p className="text-xs leading-normal text-text-secondary">
              {state.ogFileName}{" "}
              <span className="text-text-tertiary">
                ({formatFileSize(state.ogFileSize ?? 0)})
              </span>
            </p>
          )}
        </>
      ),
    },
    {
      number: 2,
      title: "Upload guide image",
      status: step2Status,
      content: (
        <>
          {step2Status === "active" && (
            <>
              <p className="text-xs leading-normal text-text-secondary">
                The gray-bordered image from Step 1.
              </p>
              <button
                type="button"
                onClick={guideTriggerUpload}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </>
          )}
          {step2Status === "completed" && (
            <p className="text-xs leading-normal text-text-secondary">
              {state.guideFileName}{" "}
              <span className="text-text-tertiary">
                ({formatFileSize(state.guideFileSize ?? 0)})
              </span>
            </p>
          )}
        </>
      ),
    },
    {
      number: 3,
      title: "Upload outpaint result",
      status: step3Status,
      content: (
        <>
          {step3Status === "active" && (
            <>
              <p className="text-xs leading-normal text-text-secondary">
                The outpainted image from Gemini.
              </p>
              <p className="text-xs leading-normal text-text-tertiary">
                Before uploading:{" "}
                <DewatermarkDialog onAccept={onUploadOutpaint} />
                {" · "}
                <a
                  href="https://upscayl.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue"
                >
                  Upscale with Upscayl ↗
                </a>
              </p>
              <button
                type="button"
                onClick={outpaintTriggerUpload}
                className="my-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
              {mergerAction}
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <aside aria-label="Merger Steps">
      <input
        ref={ogInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={ogHandleFileChange}
        data-testid="og-file-input"
      />
      <input
        ref={guideInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={guideHandleFileChange}
        data-testid="guide-file-input"
      />
      <input
        ref={outpaintInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={outpaintHandleFileChange}
        data-testid="outpaint-file-input"
      />

      {/* Mobile carousel */}
      <MobileInstructionCarousel
        steps={mobileSteps}
        currentStepIndex={state.currentStep - 1}
        ariaLabel="Merger Steps"
      />

      {/* Desktop stacked layout */}
      <div className="hidden md:flex md:flex-col md:gap-7">
        {/* Step 1 — Upload original card */}
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
              Upload the original art
            </p>
          </div>

          {step1Status === "active" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                The original art without gray border from prep step.
              </p>
              <button
                type="button"
                onClick={ogTriggerUpload}
                className="ml-8.5 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </>
          )}

          {step1Status === "completed" && (
            <p className="pl-8.5 text-xs leading-normal text-text-secondary">
              {state.ogFileName}{" "}
              <span className="text-text-tertiary">
                ({formatFileSize(state.ogFileSize ?? 0)})
              </span>
            </p>
          )}
        </div>

        {/* Step 2 — Upload guide image */}
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
              Upload guide image
            </p>
          </div>

          {step2Status === "active" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                The gray-bordered image from Step 1.
              </p>
              <button
                type="button"
                onClick={guideTriggerUpload}
                className="ml-8.5 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </>
          )}

          {step2Status === "completed" && (
            <p className="pl-8.5 text-xs leading-normal text-text-secondary">
              {state.guideFileName}{" "}
              <span className="text-text-tertiary">
                ({formatFileSize(state.guideFileSize ?? 0)})
              </span>
            </p>
          )}
        </div>

        {/* Step 3 — Upload outpaint result */}
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
              Upload outpaint result
            </p>
          </div>

          {step3Status === "active" && (
            <>
              <p className="pl-8.5 text-xs leading-normal text-text-secondary">
                The outpainted image from Gemini.
              </p>
              <p className="pl-8.5 text-xs leading-normal text-text-tertiary">
                Before uploading:{" "}
                <DewatermarkDialog onAccept={onUploadOutpaint} />
                {" · "}
                <a
                  href="https://upscayl.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue"
                >
                  Upscale with Upscayl ↗
                </a>
              </p>
              <button
                type="button"
                onClick={outpaintTriggerUpload}
                className="ml-8.5 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent-blue text-sm font-medium text-accent-blue"
              >
                <Upload className="size-3.5" />
                Choose file
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
