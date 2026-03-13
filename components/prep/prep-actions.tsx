"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

type PrepActionsProps = {
  canDownload: boolean;
  canContinue: boolean;
  onDownload: () => void;
};

export function PrepActions({
  canDownload,
  canContinue,
  onDownload,
}: PrepActionsProps) {
  return (
    <footer className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={!canDownload}
        onClick={onDownload}
        className={cn(
          "h-11 w-full rounded-lg bg-surface-overlay text-sm font-medium text-text-primary transition-colors hover:bg-surface-border",
          !canDownload && "opacity-40 cursor-not-allowed",
        )}
      >
        Download PNG
      </button>
      <Link
        href="/outpaint"
        aria-disabled={!canContinue}
        className={cn(
          "flex h-[38px] w-full items-center justify-center rounded-lg border border-surface-border text-sm font-medium text-text-primary transition-colors hover:bg-surface-raised",
          !canContinue && "opacity-40 pointer-events-none",
        )}
      >
        Continue to Outpaint
      </Link>
    </footer>
  );
}
