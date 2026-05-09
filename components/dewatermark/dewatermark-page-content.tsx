"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DewatermarkHeader } from "@/components/dewatermark/DewatermarkHeader";
import { DewatermarkEmptyState } from "@/components/dewatermark/dewatermark-empty-state";
import { DewatermarkPreviewPair } from "@/components/dewatermark/dewatermark-preview-pair";
import { DewatermarkSettingsRail } from "@/components/dewatermark/dewatermark-settings-rail";
import {
  useDewatermarkWorkspace,
  type UseDewatermarkWorkspaceOptions,
} from "@/hooks/use-dewatermark-workspace";
import { cn } from "@/lib/utils";

const MIME_BY_FORMAT: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export type DewatermarkPageContentProps = {
  workspaceOptions?: UseDewatermarkWorkspaceOptions;
};

export function DewatermarkPageContent({
  workspaceOptions,
}: DewatermarkPageContentProps = {}) {
  const ws = useDewatermarkWorkspace(workspaceOptions);
  const [globalDrag, setGlobalDrag] = useState(false);

  const originalSrc = useObjectUrlForPixels(
    ws.image,
    ws.getOriginalPixels,
    ws.getDimensions,
  );
  const resultSrc = useObjectUrlForBlob(ws.getResultBlob, ws.resultRevision);

  useEffect(() => {
    /* v8 ignore start -- SSR guard, unreachable in jsdom */
    if (typeof window === "undefined") return;
    /* v8 ignore stop */
    let counter = 0;
    function onEnter(e: DragEvent) {
      e.preventDefault();
      counter += 1;
      setGlobalDrag(true);
    }
    function onLeave(e: DragEvent) {
      e.preventDefault();
      counter -= 1;
      if (counter <= 0) {
        counter = 0;
        setGlobalDrag(false);
      }
    }
    function onOver(e: DragEvent) {
      e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      counter = 0;
      setGlobalDrag(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) void ws.acceptFile(file);
    }
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            void ws.acceptFile(file);
            return;
          }
        }
      }
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [ws]);

  function handleDownload() {
    const blob = ws.getResultBlob();
    /* v8 ignore start -- defensive guards + browser-only re-encode path */
    if (!blob || !ws.image) return;
    const targetMime =
      MIME_BY_FORMAT[ws.committedSettings.exportFormat] ?? "image/png";
    if (blob.type === targetMime) {
      triggerDownload(
        blob,
        ws.image.name,
        ws.committedSettings.exportFormat,
      );
      return;
    }
    void reencodeBlob(blob, targetMime).then((re) => {
      triggerDownload(re, ws.image!.name, ws.committedSettings.exportFormat);
    });
    /* v8 ignore stop */
  }

  return (
    <div className="flex h-dvh flex-col">
      <DewatermarkHeader />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col bg-surface-ground">
          {ws.image ? (
            <DewatermarkPreviewPair
              imageMeta={ws.image}
              originalSrc={originalSrc}
              resultSrc={resultSrc}
              draftSettings={ws.settings}
              committedSettings={ws.committedSettings}
              detection={ws.detection}
              isProcessing={ws.isProcessing}
              onClear={ws.clear}
              onDownload={handleDownload}
            />
          ) : (
            <DewatermarkEmptyState onFile={(file) => void ws.acceptFile(file)} />
          )}
        </main>
        <DewatermarkSettingsRail
          hasImage={!!ws.image}
          imageMeta={ws.image}
          settings={ws.settings}
          detection={ws.detection}
          isProcessing={ws.isProcessing}
          isDirty={ws.isDirty}
          onPatch={ws.patch}
          onReset={ws.reset}
          onUploadFile={(file) => void ws.acceptFile(file)}
          onDownload={handleDownload}
        />
      </div>
      <div
        data-testid="dewatermark-drag-overlay"
        data-active={globalDrag ? "true" : "false"}
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-50 border-2 border-dashed border-accent-blue bg-accent-blue/5 transition-opacity",
          globalDrag ? "opacity-100" : "opacity-0",
        )}
      >
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-label uppercase tracking-extra-wide text-accent-blue">
          ↓ Drop image to load
        </p>
      </div>
    </div>
  );
}

function useObjectUrlForPixels(
  image: ReturnType<typeof useDewatermarkWorkspace>["image"],
  getPixels: () => Uint8ClampedArray | null,
  getDims: () => { width: number; height: number } | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const lastImageRef = useRef<typeof image>(null);

  useEffect(() => {
    /* v8 ignore start -- Browser-only canvas/Blob path */
    if (image === lastImageRef.current && url) return;
    lastImageRef.current = image;
    if (!image) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      return;
    }
    const pixels = getPixels();
    const dims = getDims();
    if (!pixels || !dims) return;
    const canvas = document.createElement("canvas");
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const copy = new Uint8ClampedArray(pixels);
    ctx.putImageData(new ImageData(copy, dims.width, dims.height), 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const next = URL.createObjectURL(blob);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return next;
      });
    }, "image/png");
    /* v8 ignore stop */
  }, [image, getPixels, getDims, url]);

  return url;
}

function useObjectUrlForBlob(
  getBlob: () => Blob | null,
  revision: number,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    /* v8 ignore start -- URL.createObjectURL is environment-dependent */
    const blob = getBlob();
    if (!blob) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => {
      URL.revokeObjectURL(next);
    };
    /* v8 ignore stop */
  }, [getBlob, revision]);

  return useMemo(() => url, [url]);
}

function triggerDownload(blob: Blob, baseName: string, ext: string) {
  /* v8 ignore start -- Browser-only download anchor */
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stem = baseName.replace(/\.[^.]+$/, "") || "image";
  a.href = url;
  a.download = `${stem}_dewatermarked.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  /* v8 ignore stop */
}

/* v8 ignore start -- Browser-only re-encode path */
async function reencodeBlob(blob: Blob, targetMime: string): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(bitmap.width, bitmap.height)
      : (() => {
          const c = document.createElement("canvas");
          c.width = bitmap.width;
          c.height = bitmap.height;
          return c as unknown as OffscreenCanvas;
        })();
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: targetMime });
  }
  return new Promise((resolve) => {
    (canvas as unknown as HTMLCanvasElement).toBlob(
      (b) => resolve(b ?? blob),
      targetMime,
    );
  });
}
/* v8 ignore stop */
