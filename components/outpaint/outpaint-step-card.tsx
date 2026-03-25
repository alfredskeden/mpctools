"use client";

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
  return (
    <div
      data-active={String(isActive)}
      className={cn(
        "flex flex-col rounded-lg gap-3.5 bg-instructions-card border border-white/9 p-5",
        !isActive && "opacity-35",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isActive ? (
            <div data-slot="step-badge" data-active="true" className="flex items-center justify-center w-5.5 h-5.5 shrink-0 rounded-full bg-accent-blue">
              <span className="text-micro text-white font-bold">
                {stepNumber}
              </span>
            </div>
          ) : (
            <div data-slot="step-badge" data-active="false" className="flex items-center justify-center w-5.5 h-5.5 shrink-0 rounded-full border-1.5 border-surface-muted">
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
          className="flex items-center justify-center gap-1.5 rounded-md py-1.5 px-3.5 bg-accent-blue"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span data-copied={String(copied)} className="text-xs leading-4 text-white font-bold">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
      <span className="sr-only">{codeText}</span>
      {isActive && hintText && (
        <div className="flex items-center rounded-md py-2 px-3 gap-2 bg-accent-blue/8">
          <div className="shrink-0 rounded-full bg-accent-blue size-1.5" />
          <span className="text-caption text-accent-blue-muted font-medium">
            {hintText}
          </span>
        </div>
      )}
    </div>
  );
};
