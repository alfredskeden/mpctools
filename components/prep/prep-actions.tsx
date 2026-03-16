"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

type PrepActionsProps = {
  canDownload: boolean;
  canContinue: boolean;
  isDownloaded: boolean;
  onDownload: () => void;
};

export const PrepActions = ({
  canDownload,
  canContinue,
  isDownloaded,
  onDownload,
}: PrepActionsProps) => {
  return (
    <footer className="flex flex-col gap-2.5">
      {isDownloaded ? (
        <button
          type="button"
          disabled
          className="h-11 w-full rounded-lg border border-status-success-dark bg-surface-overlay text-sm font-medium text-status-success"
        >
          Downloaded ✓
        </button>
      ) : (
        <button
          type="button"
          disabled={!canDownload}
          onClick={onDownload}
          className={cn(
            "h-11 w-full rounded-lg text-sm font-medium transition-colors",
            canDownload
              ? "bg-accent-blue text-white hover:bg-accent-blue/90"
              : "bg-surface-overlay text-text-primary opacity-40 cursor-not-allowed",
          )}
        >
          Download PNG
        </button>
      )}
      <Link
        href="/outpaint"
        aria-disabled={!canContinue}
        className={cn(
          "flex h-9.5 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors",
          canContinue
            ? "border border-surface-border text-text-primary hover:bg-surface-overlay"
            : "border border-surface-border text-text-primary opacity-40 pointer-events-none",
        )}
      >
        Continue to Outpaint
      </Link>
    </footer>
  );
};
