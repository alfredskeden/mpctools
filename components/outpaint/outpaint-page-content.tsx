"use client";

import { useState, useEffect } from "react";
import {
  useOutpaintWorkflow,
  buildHandshakePrompt,
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
} from "@/hooks/use-outpaint-workflow";
import { PREP_CANVAS_SIZE_KEY } from "@/hooks/use-prep-workflow";
import { useCopyToClipboard } from "@/hooks/use-clipboard";
import { OutpaintStepCard } from "./outpaint-step-card";
import { CollapsedStep } from "./collapsed-step";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const OutpaintPageContent = () => {
  const { state, sendHandshake, toggleHandshakeCollapse, canContinueToMerge } =
    useOutpaintWorkflow();
  const handshakeClipboard = useCopyToClipboard();
  const commandClipboard = useCopyToClipboard();
  const [handshakePrompt, setHandshakePrompt] = useState(HANDSHAKE_PROMPT);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PREP_CANVAS_SIZE_KEY);
      if (stored) {
        const { width, height } = JSON.parse(stored) as {
          width: number;
          height: number;
        };
        setHandshakePrompt(buildHandshakePrompt(width, height));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center bg-surface-ground p-6">
      <div className="flex flex-col gap-4 w-full max-w-content">
        {state.handshakeSent && state.handshakeCollapsed ? (
          <CollapsedStep
            title="THE HANDSHAKE"
            onToggle={toggleHandshakeCollapse}
          />
        ) : (
          <OutpaintStepCard
            stepNumber={1}
            title="THE HANDSHAKE"
            codeText={handshakePrompt}
            hintText='Copy this prompt, send it to Gemini, and wait for "Universal Neutral Extension Mode Locked. Ready for any input."'
            isActive={!state.handshakeSent}
            onCopy={() => handshakeClipboard.copy(handshakePrompt)}
            copied={handshakeClipboard.copied}
          />
        )}
        {!canContinueToMerge && (
          <button
            type="button"
            onClick={sendHandshake}
            className="flex items-center justify-center h-10.5 rounded-lg gap-2 border-1.5 border-accent-blue"
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
            <span className="text-label text-accent-blue font-semibold">
              I&apos;ve sent the handshake
            </span>
          </button>
        )}
        <OutpaintStepCard
          stepNumber={2}
          title="OUTPAINT COMMAND"
          codeText={OUTPAINT_COMMAND}
          hintText="Copy this command, paste it in Gemini along with your prepared image"
          isActive={state.handshakeSent}
          onCopy={() => commandClipboard.copy(OUTPAINT_COMMAND)}
          copied={commandClipboard.copied}
        />
        <Link
          href="/merger"
          aria-disabled={!canContinueToMerge}
          className={cn(
            "flex items-center justify-center h-10.5 rounded-lg text-label font-semibold",
            canContinueToMerge
              ? "border border-surface-border text-text-primary hover:bg-surface-overlay"
              : "opacity-40 border border-surface-border text-text-tertiary pointer-events-none",
          )}
        >
          Continue to Merge
        </Link>
      </div>
    </div>
  );
};
