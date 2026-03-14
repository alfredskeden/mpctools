"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

type OutpaintActionsProps = {
  handshakeSent: boolean;
  onSendHandshake: () => void;
};

export function OutpaintActions({
  handshakeSent,
  onSendHandshake,
}: OutpaintActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      {!handshakeSent && (
        <button
          type="button"
          onClick={onSendHandshake}
          className="flex items-center justify-center h-[42px] rounded-lg gap-2 border-[1.5px] border-accent-blue"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent-blue"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-[13px] leading-4 text-accent-blue font-semibold">
            I've sent the handshake
          </span>
        </button>
      )}
      <Link
        href="/merger"
        aria-disabled={!handshakeSent}
        className={cn(
          "flex items-center justify-center h-[42px] rounded-lg text-[13px] leading-4 font-semibold",
          handshakeSent
            ? "bg-accent-blue text-white"
            : "opacity-40 bg-surface-overlay text-text-tertiary pointer-events-none",
        )}
      >
        Continue to Merge
      </Link>
    </div>
  );
}
