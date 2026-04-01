"use client";

import { useCallback, useRef } from "react";
import { Upload } from "lucide-react";

type ImageUploaderProps = {
  onUpload: (image: HTMLImageElement, fileName: string) => void;
};

export function ImageUploader({ onUpload }: ImageUploaderProps) {
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
        img.onload = () => {
          onUpload(img, fileName);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);

      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload],
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="text-label font-semibold tracking-wide text-text-primary">
        Upload original image
      </span>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-muted bg-surface-raised px-4 py-8 transition-colors hover:border-accent-blue hover:bg-accent-blue/5">
        <Upload className="size-5 text-text-tertiary" />
        <span className="text-sm text-text-secondary">
          Click to upload your card art
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
    </div>
  );
}
