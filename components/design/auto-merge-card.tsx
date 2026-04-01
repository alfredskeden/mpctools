"use client";

import { Loader2 } from "lucide-react";

type AutoMergeCardProps = {
  mergePhase: "idle" | "processing" | "done";
};

export function AutoMergeCard({ mergePhase }: AutoMergeCardProps) {
  if (mergePhase !== "processing") return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-4">
      <Loader2
        className="size-5 shrink-0 animate-spin text-accent-blue"
        data-testid="merge-spinner"
      />
      <span className="text-sm text-text-secondary">
        Merging images...
      </span>
    </div>
  );
}
