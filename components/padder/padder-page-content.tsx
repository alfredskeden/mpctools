"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { usePadderWorkflow } from "@/hooks/use-padder-workflow";
import { usePasteImage } from "@/hooks/use-paste-image";
import { exportPaddedCanvas, paddedFileName } from "@/lib/padder-renderer";
import { downloadCanvasAsBlob } from "@/lib/merger-utils";
import { cn } from "@/lib/utils";
import { PadderCanvas } from "./PadderCanvas";
import { TargetSelector } from "./target-selector";
import { PadderActions } from "./padder-actions";
import { PadderBatchContent } from "./padder-batch-content";

type PadderMode = "single" | "batch";

export function PadderPageContent() {
  const {
    state,
    layout,
    target,
    uploadImage,
    selectTarget,
    markDownloaded,
    hasError,
    canDownload,
    canContinue,
  } = usePadderWorkflow();
  const [mode, setMode] = useState<PadderMode>("single");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSingle = mode === "single";

  const loadImageFile = useCallback(
    (file: File) => {
      // Batch mode owns its own input; the single-scan handoff stays inert.
      if (mode !== "single") return;
      if (!file.type.startsWith("image/")) return;

      // A pasted file often carries no name of its own.
      const fileName = file.name || "pasted-scan.png";
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => uploadImage(img, fileName);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [uploadImage, mode],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      loadImageFile(file);
    },
    [loadImageFile],
  );

  usePasteImage(loadImageFile);

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDownload = useCallback(() => {
    /* v8 ignore start */
    if (!state.imageElement || !layout) return;
    /* v8 ignore stop */

    const canvas = exportPaddedCanvas(state.imageElement, layout);
    /* v8 ignore start */
    if (!canvas) return;
    /* v8 ignore stop */

    downloadCanvasAsBlob(canvas, paddedFileName(state.fileName));
    markDownloaded();
  }, [state.imageElement, state.fileName, layout, markDownloaded]);

  return (
    <main className="flex min-h-0 flex-1 flex-col lg:flex-row bg-surface-ground">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="padder-file-input"
      />

      <div className="flex min-h-0 flex-1 items-center justify-center p-4 lg:p-6">
        {isSingle ? (
          state.imageElement && layout ? (
            <PadderCanvas image={state.imageElement} layout={layout} />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <button
                type="button"
                data-testid="padder-upload-btn"
                onClick={handleUploadClick}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-blue px-4 text-sm font-medium text-white"
              >
                <Upload className="size-3.5" />
                Upload scan
              </button>
              <p className="text-xs text-text-tertiary">or paste an image</p>
            </div>
          )
        ) : (
          <div className="w-full max-w-md">
            <PadderBatchContent target={target} />
          </div>
        )}
      </div>

      <aside
        aria-label="Pad settings"
        className="flex shrink-0 flex-col gap-4 border-t border-surface-border p-4 lg:w-sidebar-instructions lg:border-t-0 lg:border-l lg:p-5"
      >
        <div
          role="radiogroup"
          aria-label="Padding mode"
          className="flex gap-2"
        >
          {(["single", "batch"] as const).map((option) => {
            const selected = option === mode;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                data-testid={`mode-${option}`}
                onClick={() => setMode(option)}
                className={cn(
                  "h-9 flex-1 rounded-lg border text-sm font-medium",
                  selected
                    ? "border-accent-blue bg-surface-raised text-text-primary"
                    : "border-white/10 bg-surface-base text-text-secondary",
                )}
              >
                {option === "single" ? "Single scan" : "Batch"}
              </button>
            );
          })}
        </div>

        {isSingle && hasError && (
          <p
            role="alert"
            data-testid="padder-error"
            className="rounded-lg border border-surface-border bg-surface-raised p-3 text-xs text-text-primary"
          >
            This does not look like a portrait card scan. Upload the card image
            itself, at whatever resolution Scryfall gave you — the padder works
            out the bleed from its size and never resamples it.
          </p>
        )}

        <TargetSelector
          selectedId={state.targetId}
          layout={isSingle ? layout : null}
          onSelect={selectTarget}
        />

        {isSingle && state.imageElement && (
          <button
            type="button"
            data-testid="padder-replace-btn"
            onClick={handleUploadClick}
            className="h-9 w-full rounded-lg border border-surface-border text-sm font-medium text-text-primary"
          >
            Replace scan
          </button>
        )}

        {isSingle && (
          <PadderActions
            canDownload={canDownload}
            canContinue={canContinue}
            isDownloaded={state.downloaded}
            onDownload={handleDownload}
          />
        )}
      </aside>
    </main>
  );
}
