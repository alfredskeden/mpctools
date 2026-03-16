"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type OutpaintStepCardProps = {
  stepNumber: number;
  title: string;
  codeText: string;
  hintText?: string;
  isActive: boolean;
  onCopy: () => void;
  copied: boolean;
};

export const OutpaintStepCard = ({
  stepNumber,
  title,
  codeText,
  hintText,
  isActive,
  onCopy,
  copied,
}: OutpaintStepCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg gap-3.5 bg-surface-raised border border-surface-border p-5",
        !isActive && "opacity-35",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isActive ? (
            <div className="flex items-center justify-center w-5.5 h-5.5 shrink-0 rounded-full bg-accent-blue">
              <span className="text-micro text-white font-bold">
                {stepNumber}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-5.5 h-5.5 shrink-0 rounded-full border-1.5 border-surface-muted">
              <span className="text-micro text-text-tertiary font-bold">
                {stepNumber}
              </span>
            </div>
          )}
          <span
            className={cn(
              "text-label tracking-wide font-semibold",
              isActive ? "text-text-primary" : "text-text-secondary",
            )}
          >
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center justify-center gap-1.5 rounded-md py-1.5 px-3.5 border border-surface-subtle bg-surface-overlay"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-text-secondary"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span className="text-xs leading-4 text-text-primary font-semibold">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
      <div className="flex flex-col rounded-md py-3.5 px-4 bg-surface-ground">
        <div
          className={cn("relative", !expanded && "max-h-22 overflow-hidden")}
        >
          <span
            className={cn(
              "text-caption leading-4.5 font-mono whitespace-pre-line",
              isActive ? "text-text-code" : "text-text-tertiary",
            )}
          >
            {codeText}
          </span>
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-surface-ground to-transparent" />
          )}
        </div>
      </div>
      {isActive && hintText && (
        <div className="flex items-center rounded-md py-2 px-3 gap-2 bg-accent-blue/8">
          <div className="shrink-0 rounded-full bg-accent-blue size-1.5" />
          <span className="text-caption text-accent-blue-muted font-medium">
            {hintText}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center gap-1 py-1"
      >
        <span className="text-caption text-text-tertiary font-medium">
          {expanded ? "Show less" : "Show more"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("text-text-tertiary", expanded && "rotate-180")}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
};
