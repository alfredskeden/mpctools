"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type DewatermarkEmptyStateProps = {
  onFile: (file: File) => void;
};

export function DewatermarkEmptyState({ onFile }: DewatermarkEmptyStateProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  function pickFile() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image to dewatermark"
        data-testid="dewatermark-empty-card"
        data-drag={drag ? "true" : undefined}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFile();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex w-full max-w-content cursor-pointer flex-col items-center gap-4 rounded-2xl border border-dashed bg-surface-base p-13 text-center transition-colors",
          "focus-visible:outline-2 focus-visible:outline-accent-blue",
          drag
            ? "border-accent-blue bg-accent-blue/5"
            : "border-surface-border",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          data-testid="dewatermark-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <div className="flex size-13 items-center justify-center rounded-xl bg-surface-raised text-text-tertiary">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold tracking-display text-text-primary">
          Remove a Gemini watermark
        </h2>
        <p className="max-w-content text-caption text-text-secondary">
          Upload an outpainted image. We detect and remove the AI watermark
          using reverse-alpha matting. The original stays on the left, the
          repaired version on the right.
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              pickFile();
            }}
          >
            <Upload className="size-3" aria-hidden="true" />
            Upload image
          </Button>
        </div>
        <p className="flex items-center gap-1.5 pt-2 font-mono text-caption text-text-tertiary">
          <span>Drag &amp; drop anywhere · paste with</span>
          <span className="rounded-xs border border-surface-border bg-surface-overlay px-1.5 py-px text-text-secondary">
            ⌘V
          </span>
        </p>
      </div>
    </div>
  );
}
