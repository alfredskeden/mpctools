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
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload image"
      className={cn(
        "flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragging
          ? "border-brand bg-brand/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
      )}
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
      <Upload className="size-10 text-muted-foreground" />
      <p className="mt-4 text-sm font-medium">Drop your card art here</p>
      <p className="mt-1 text-xs text-muted-foreground">
        or click to browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        data-testid="file-input"
      />
    </div>
  );
}
