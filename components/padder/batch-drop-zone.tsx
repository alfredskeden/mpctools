"use client";

import { useCallback, useRef } from "react";
import { FolderOpen, Files } from "lucide-react";
import { collectImageFiles, collectDroppedFiles } from "@/lib/file-collection";

function detectFolderSupport(): boolean {
  return (
    typeof HTMLInputElement !== "undefined" &&
    "webkitdirectory" in HTMLInputElement.prototype
  );
}

type BatchDropZoneProps = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /** Overridable for tests; defaults to a `webkitdirectory` feature check. */
  folderSupported?: boolean;
};

export function BatchDropZone({
  onFiles,
  disabled = false,
  folderSupported = detectFolderSupport(),
}: BatchDropZoneProps) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = collectImageFiles(event.target.files);
      if (files.length > 0) onFiles(files);
      event.target.value = "";
    },
    [onFiles],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = await collectDroppedFiles(event.dataTransfer);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  return (
    <div
      data-testid="batch-drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-surface-border bg-surface-base p-6 text-center"
    >
      <input
        ref={filesInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        data-testid="batch-files-input"
        onChange={handleInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        data-testid="batch-folder-input"
        onChange={handleInputChange}
        {...{ webkitdirectory: "", directory: "" }}
      />

      <p className="text-xs text-text-tertiary">Drop a folder or scans here</p>

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="batch-files-btn"
          disabled={disabled}
          onClick={() => filesInputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-surface-border px-4 text-sm font-medium text-text-primary disabled:opacity-50"
        >
          <Files className="size-3.5" />
          Choose files
        </button>

        {folderSupported && (
          <button
            type="button"
            data-testid="batch-folder-btn"
            disabled={disabled}
            onClick={() => folderInputRef.current?.click()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-surface-border px-4 text-sm font-medium text-text-primary disabled:opacity-50"
          >
            <FolderOpen className="size-3.5" />
            Choose folder
          </button>
        )}
      </div>
    </div>
  );
}
