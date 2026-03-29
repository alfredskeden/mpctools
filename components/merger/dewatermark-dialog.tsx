"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Upload, Loader2 } from "lucide-react";
import { useDewatermarkDialog } from "@/hooks/use-dewatermark-dialog";
import type { DewatermarkState } from "@/hooks/use-dewatermark-dialog";

type DewatermarkDialogProps = {
  onAccept: (
    image: HTMLImageElement,
    fileName: string,
    fileSize: number,
  ) => void;
};

export function DewatermarkDialog({ onAccept }: DewatermarkDialogProps) {
  const [open, setOpen] = useState(false);
  const { state, processFile, reset, acceptResult, runAdaptiveDetection } = useDewatermarkDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset();
      setOpen(nextOpen);
    },
    [reset],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAccept = useCallback(async () => {
    const result = await acceptResult();
    onAccept(result.image, result.fileName, result.fileSize);
    setOpen(false);
  }, [acceptResult, onAccept]);

  const handleCancel = useCallback(() => {
    reset();
    setOpen(false);
  }, [reset]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-accent-blue"
        >
          De-watermark
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-dialog-dewatermark"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>
            {state.phase === "result"
              ? "Watermark Removed"
              : "Remove Gemini Watermark"}
          </DialogTitle>
          <DialogDescription>
            {getDescription(state)}
          </DialogDescription>
        </DialogHeader>

        {state.phase === "idle" && (
          <IdleContent
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onUploadClick={handleUploadClick}
          />
        )}

        {state.phase === "processing" && <ProcessingContent />}

        {state.phase === "result" && (
          <ResultContent state={state} />
        )}

        {state.phase === "error" && (
          <ErrorContent message={state.message} onRetry={reset} />
        )}

        {state.phase === "result" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={runAdaptiveDetection}
              data-testid="dewatermark-adaptive-detect"
            >
              Adaptive Detect
            </Button>
            <Button onClick={handleAccept}>Use this image</Button>
          </DialogFooter>
        )}

        {state.phase === "processing" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getDescription(state: DewatermarkState): string {
  switch (state.phase) {
    case "idle":
      return "Upload an image to remove the watermark automatically";
    case "processing":
      return "Processing your image...";
    case "result":
      return "Preview the result below";
    case "error":
      return "Something went wrong";
  }
}

function IdleContent({
  fileInputRef,
  onFileChange,
  onUploadClick,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
}) {
  return (
    <div
      data-testid="dewatermark-upload-zone"
      className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-surface-border p-10"
      onClick={onUploadClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onUploadClick();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        data-testid="dewatermark-file-input"
      />
      <div className="flex size-12 items-center justify-center rounded-lg bg-surface-raised">
        <Upload className="size-5 text-text-tertiary" />
      </div>
      <p className="text-sm font-medium text-text-secondary">
        Drop your outpaint image here
      </p>
      <p className="text-xs text-text-tertiary">or click to browse</p>
    </div>
  );
}

function ProcessingContent() {
  return (
    <div
      data-testid="dewatermark-spinner"
      className="flex flex-col items-center justify-center gap-4 py-14"
    >
      <Loader2 className="size-8 animate-spin text-accent-blue" />
      <p className="text-sm font-medium text-text-secondary">
        Detecting and removing watermark...
      </p>
      <p className="text-xs text-text-tertiary">
        This usually takes a few seconds
      </p>
    </div>
  );
}

function ResultContent({
  state,
}: {
  state: Extract<DewatermarkState, { phase: "result" }>;
}) {
  return (
    <div data-testid="dewatermark-preview" className="flex flex-col gap-3">
      <div className="flex items-center justify-center rounded-lg bg-surface-raised p-4">
        <img
          src={state.previewUrl}
          alt="De-watermarked preview"
          className="max-h-80 rounded object-contain"
        />
      </div>
      <div
        data-testid="dewatermark-metadata"
        className="flex items-center gap-4 font-mono text-xs"
      >
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-status-success" />
          <span className="text-text-secondary">{state.metadata.corner}</span>
        </span>
        <span>
          <span className="text-text-tertiary">confidence </span>
          <span className="text-text-secondary">
            {state.metadata.confidence.toFixed(2)}
          </span>
        </span>
        <span>
          <span className="text-text-tertiary">gain </span>
          <span className="text-text-secondary">
            {state.metadata.alphaGain.toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ErrorContent({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      data-testid="dewatermark-error"
      className="flex flex-col items-center justify-center gap-4 py-10"
    >
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
