"use client";

import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type FinalResultCardProps = {
  mergedCanvasDataUrl: string;
  isDownloaded: boolean;
  originalFileName: string | null;
  onDownload: (fileName: string) => void;
  onExportPsd: (fileName: string) => void;
  onReset: () => void;
};

export function FinalResultCard({
  mergedCanvasDataUrl,
  isDownloaded,
  originalFileName,
  onDownload,
  onExportPsd,
  onReset,
}: FinalResultCardProps) {
  const downloadName = originalFileName
    ? originalFileName.replace(/\.[^.]+$/, "-merged.png")
    : "merged-outpaint.png";

  const psdName = originalFileName
    ? originalFileName.replace(/\.[^.]+$/, "-merged.psd")
    : "merged-outpaint.psd";

  return (
    <div className="flex flex-col gap-4">
      <span className="text-label font-semibold tracking-wide text-text-primary">
        Final result
      </span>
      <div className="overflow-hidden rounded-lg border border-surface-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mergedCanvasDataUrl}
          alt="Merged outpaint result"
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onDownload(downloadName)}
          className="flex-1"
        >
          <Download className="size-4" />
          {isDownloaded ? "Downloaded" : "Download PNG"}
        </Button>
        <Button variant="outline" onClick={() => onExportPsd(psdName)}>
          <Download className="size-4" />
          Download PSD
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" />
          Start over
        </Button>
      </div>
    </div>
  );
}
