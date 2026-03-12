"use client";

import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <footer className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        disabled={!canDownload}
        onClick={onDownload}
      >
        <Download className="size-4" />
        Download PNG
      </Button>
      <Button asChild disabled={!canContinue}>
        <Link href="/outpaint" aria-disabled={!canContinue}>
          Continue to Outpaint
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </footer>
  );
}
