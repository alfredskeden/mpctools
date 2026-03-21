"use client";

import type { LucideIcon } from "lucide-react";

type ToolbarIconButtonProps = {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function ToolbarIconButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
        isActive
          ? "bg-surface-overlay text-accent-blue"
          : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
      } disabled:pointer-events-none disabled:opacity-35`}
    >
      <Icon className="size-4" />
    </button>
  );
}
