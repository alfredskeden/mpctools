"use client";

type CollapsedStepProps = {
  title: string;
  onToggle: () => void;
};

export function CollapsedStep({ title, onToggle }: CollapsedStepProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between rounded-[10px] py-4 px-5 bg-surface-raised border border-surface-border w-full"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-full bg-[#22C55E]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <span className="text-[13px] tracking-[0.03em] leading-4 text-text-secondary font-semibold">
          {title}
        </span>
        <span className="text-[11px] leading-3.5 text-[#22C55E] font-medium">
          Sent
        </span>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-text-tertiary"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}
