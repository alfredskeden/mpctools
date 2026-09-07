"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type PadderActionsProps = {
  canDownload: boolean;
  canContinue: boolean;
  isDownloaded: boolean;
  onDownload: () => void;
};

export function PadderActions({
  canDownload,
  canContinue,
  isDownloaded,
  onDownload,
}: PadderActionsProps) {
  return (
    <footer className="flex flex-col gap-2.5">
      <button
        type="button"
        data-testid="padder-download-btn"
        data-downloaded={isDownloaded}
        disabled={!canDownload || isDownloaded}
        onClick={onDownload}
        className={cn(
          "h-11 w-full rounded-lg text-sm font-medium transition-colors",
          isDownloaded
            ? "border border-status-success-dark bg-surface-overlay text-status-success"
            : canDownload
              ? "bg-accent-blue text-white hover:bg-accent-blue/90"
              : "bg-surface-overlay text-text-primary opacity-40 cursor-not-allowed",
        )}
      >
        {isDownloaded ? "Downloaded ✓" : "Download PNG"}
      </button>

      <Link
        href="/padder-outpaint"
        data-testid="padder-continue-link"
        aria-disabled={canContinue ? "false" : "true"}
        className={cn(
          "flex h-9.5 w-full items-center justify-center rounded-lg border border-surface-border text-sm font-medium text-text-primary transition-colors",
          canContinue
            ? "hover:bg-surface-overlay"
            : "opacity-40 pointer-events-none",
        )}
      >
        Continue to Outpaint
      </Link>
    </footer>
  );
}
