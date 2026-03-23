"use client";

import type { ReactNode } from "react";

type ToolbarPanelWrapperProps = {
  title: string;
  children: ReactNode;
};

export function ToolbarPanelWrapper({
  title,
  children,
}: ToolbarPanelWrapperProps) {
  return (
    <div className="flex min-h-full w-64 flex-col gap-4 border-r border-surface-border bg-surface-base p-4">
      <h3 className="text-xs font-semibold uppercase tracking-label text-text-secondary">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
