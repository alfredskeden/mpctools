"use client";

import { useCallback, useRef } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import {
  useCopyToClipboard,
  useCopyImageToClipboard,
} from "@/hooks/use-clipboard";

type OutpaintHandoffProps = {
  handshakePrompt: string;
  outpaintCommand: string;
  grayBorderDataUrl: string | null;
  dewatermarkPhase: "idle" | "processing" | "done" | "error";
  dewatermarkError: string | null;
  onUploadOutpaint: (file: File) => void;
};

export function OutpaintHandoff({
  handshakePrompt,
  outpaintCommand,
  grayBorderDataUrl,
  dewatermarkPhase,
  dewatermarkError,
  onUploadOutpaint,
}: OutpaintHandoffProps) {
  const handshakeClipboard = useCopyToClipboard();
  const commandClipboard = useCopyToClipboard();
  const imageClipboard = useCopyImageToClipboard();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      onUploadOutpaint(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUploadOutpaint],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <PromptBlock
          stepNumber={1}
          title="The Handshake"
          onCopy={() => handshakeClipboard.copy(handshakePrompt)}
          copied={handshakeClipboard.copied}
          hintText="Copy and paste this to Gemini first"
        />
        <PromptBlock
          stepNumber={2}
          title="Outpaint Command"
          onCopy={() => commandClipboard.copy(outpaintCommand)}
          copied={commandClipboard.copied}
          hintText="Attach the gray border image below and send with this prompt"
        />
      </div>

      {grayBorderDataUrl && (
        <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={grayBorderDataUrl}
            alt="Gray border canvas to send to Gemini"
            className="h-16 w-auto rounded border border-surface-border"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text-primary">
              Send this image to Gemini
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageClipboard.copyImage(grayBorderDataUrl!)}
                className="text-caption text-accent-blue hover:underline"
              >
                {imageClipboard.copied ? "Copied!" : "Copy to clipboard"}
              </button>
              <span className="text-caption text-text-tertiary">or</span>
              <a
                href={grayBorderDataUrl}
                download="outpaint-canvas.png"
                className="text-caption text-accent-blue hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-label font-semibold tracking-wide text-text-primary">
          Upload outpaint result
        </span>

        {dewatermarkPhase === "idle" && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-muted bg-surface-raised px-4 py-6 transition-colors hover:border-accent-blue hover:bg-accent-blue/5">
            <Upload className="size-5 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              Upload outpaint image from Gemini
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}

        {dewatermarkPhase === "processing" && (
          <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-4">
            <Loader2
              className="size-5 shrink-0 animate-spin text-accent-blue"
              data-testid="dewatermark-spinner"
            />
            <span className="text-sm text-text-secondary">
              Removing watermark...
            </span>
          </div>
        )}

        {dewatermarkPhase === "done" && (
          <div className="flex items-center gap-2 rounded-lg border border-status-success-dark/30 bg-status-success/8 p-3">
            <div className="flex size-5 items-center justify-center rounded-full bg-status-success-dark">
              <Check className="size-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-status-success">
              Watermark removed
            </span>
          </div>
        )}

        {dewatermarkPhase === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/8 p-3"
          >
            <span className="text-sm text-red-400">
              {dewatermarkError ?? "Watermark removal failed"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptBlock({
  stepNumber,
  title,
  onCopy,
  copied,
  hintText,
}: {
  stepNumber: number;
  title: string;
  onCopy: () => void;
  copied: boolean;
  hintText: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-5.5 items-center justify-center rounded-full bg-accent-blue">
            <span className="text-micro font-bold text-white">
              {stepNumber}
            </span>
          </div>
          <span className="text-label font-semibold tracking-wide text-text-primary">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center justify-center gap-1.5 rounded-md bg-accent-blue px-3.5 py-1.5"
        >
          <span
            data-copied={String(copied)}
            className="text-xs font-bold leading-4 text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-accent-blue/8 px-3 py-2">
        <div className="size-1.5 shrink-0 rounded-full bg-accent-blue" />
        <span className="text-caption font-medium text-accent-blue-muted">
          {hintText}
        </span>
      </div>
    </div>
  );
}
