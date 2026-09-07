"use client";

import { useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { usePadderWorkflow } from "@/hooks/use-padder-workflow";
import { usePasteImage } from "@/hooks/use-paste-image";
import { exportPaddedCanvas, paddedFileName } from "@/lib/padder-renderer";
import { downloadCanvasAsBlob } from "@/lib/merger-utils";
import { PadderCanvas } from "./PadderCanvas";
import { TargetSelector } from "./target-selector";
import { PadderActions } from "./padder-actions";

export function PadderPageContent() {
  const {
    state,
    layout,
    uploadImage,
    selectTarget,
    markDownloaded,
    hasError,
    canDownload,
    canContinue,
  } = usePadderWorkflow();
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImageFile = useCallback(
    (file: File) => {
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
    [uploadImage],
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
        {state.imageElement && layout ? (
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
        )}
      </div>

      <aside
        aria-label="Pad settings"
        className="flex shrink-0 flex-col gap-4 border-t border-surface-border p-4 lg:w-sidebar-instructions lg:border-t-0 lg:border-l lg:p-5"
      >
        {hasError && (
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
          layout={layout}
          onSelect={selectTarget}
        />

        {state.imageElement && (
          <button
            type="button"
            data-testid="padder-replace-btn"
            onClick={handleUploadClick}
            className="h-9 w-full rounded-lg border border-surface-border text-sm font-medium text-text-primary"
          >
            Replace scan
          </button>
        )}

        <PadderActions
          canDownload={canDownload}
          canContinue={canContinue}
          isDownloaded={state.downloaded}
          onDownload={handleDownload}
        />
      </aside>
    </main>
  );
}
