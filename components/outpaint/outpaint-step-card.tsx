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

export function OutpaintStepCard({
  stepNumber,
  title,
  codeText,
  hintText,
  isActive,
  onCopy,
  copied,
}: OutpaintStepCardProps) {
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
        {isActive && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center rounded-md py-1.5 px-3.5 bg-accent-blue"
          >
            <span className="text-xs leading-4 text-white font-semibold">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-col rounded-md py-3.5 px-4 bg-surface-ground">
        <span
          className={cn(
            "text-caption leading-4.5 font-mono",
            isActive ? "text-text-code" : "text-text-tertiary",
          )}
        >
          {codeText}
        </span>
      </div>
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
}
