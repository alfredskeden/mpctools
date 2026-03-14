"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageDropZoneProps = {
  onImageLoad: (dataUrl: string, element: HTMLImageElement) => void;
};

export function ImageDropZone({ onImageLoad }: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => onImageLoad(dataUrl, img);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="flex items-center justify-center">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        className="aspect-canvas w-full max-w-canvas rounded-lg bg-canvas-bg p-4"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div
          className={cn(
            "flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-accent-blue bg-accent-blue/10"
              : "border-white/25 hover:border-white/50",
          )}
        >
          <Upload className="size-10 text-white/50" />
          <p className="mt-4 text-sm font-medium text-white/50">
            Drop image here
          </p>
          <p className="mt-1 text-xs text-white/30">or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          data-testid="file-input"
        />
      </div>
    </div>
  );
}
