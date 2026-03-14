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
        "flex flex-col rounded-[10px] gap-3.5 bg-surface-raised border border-surface-border p-5",
        !isActive && "opacity-35",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isActive ? (
            <div className="flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-full bg-accent-blue">
              <span className="text-[10px] leading-3 text-white font-bold">
                {stepNumber}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-full border-[1.5px] border-surface-muted">
              <span className="text-[10px] leading-3 text-text-tertiary font-bold">
                {stepNumber}
              </span>
            </div>
          )}
          <span
            className={cn(
              "text-[13px] tracking-[0.03em] leading-4 font-semibold",
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
            <span className="text-[12px] leading-4 text-white font-semibold">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-col rounded-md py-3.5 px-4 bg-surface-ground">
        <span
          className={cn(
            "text-[11px] leading-[18px] font-mono",
            isActive ? "text-[#AAAAAA]" : "text-text-tertiary",
          )}
        >
          {codeText}
        </span>
      </div>
      {isActive && hintText && (
        <div className="flex items-center rounded-md py-2 px-3 gap-2 bg-[#4488FF14]">
          <div className="shrink-0 rounded-full bg-accent-blue size-1.5" />
          <span className="text-[11px] leading-3.5 text-[#6699EE] font-medium">
            {hintText}
          </span>
        </div>
      )}
    </div>
  );
}
