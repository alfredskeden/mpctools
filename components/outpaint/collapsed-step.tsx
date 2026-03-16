"use client";

type CollapsedStepProps = {
  title: string;
  onToggle: () => void;
};

export const CollapsedStep = ({ title, onToggle }: CollapsedStepProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between rounded-lg py-4 px-5 bg-surface-raised border border-surface-border w-full"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-5.5 h-5.5 shrink-0 rounded-full bg-status-success">
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
        <span className="text-label tracking-wide text-text-secondary font-semibold">
          {title}
        </span>
        <span className="text-caption text-status-success font-medium">
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
};
