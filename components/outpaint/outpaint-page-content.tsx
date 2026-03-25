"use client";

import { useState } from "react";
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
import { PromptGuideSection } from "./prompt-guide-section";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const OutpaintPageContent = () => {
  const { state, sendHandshake, toggleHandshakeCollapse, canContinueToMerge } =
    useOutpaintWorkflow();
  const handshakeClipboard = useCopyToClipboard();
  const commandClipboard = useCopyToClipboard();
  const [handshakePrompt] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PREP_CANVAS_SIZE_KEY);
      if (stored) {
        const { width, height } = JSON.parse(stored) as {
          width: number;
          height: number;
        };
        return buildHandshakePrompt(width, height);
      }
    } catch {
      // ignore
    }
    return HANDSHAKE_PROMPT;
  });

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row bg-surface-ground">
      <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-96 lg:p-8 lg:pb-8">
        <h1 className="text-xs font-bold mb-2 uppercase text-accent-blue">
          Prompt Guide
        </h1>
        <PromptGuideSection />
      </div>
      <aside
        aria-label="Instructions"
        className="fixed bottom-0 inset-x-0 z-10 flex flex-col gap-3 border-t border-white/8 p-4 bg-instructions-panel lg:relative lg:inset-auto lg:z-auto lg:w-sidebar-instructions lg:shrink-0 lg:gap-4 lg:border-t-0 lg:border-l lg:p-5"
      >
        <h2 className="sr-only lg:not-sr-only lg:pb-3 lg:border-b lg:border-white/6 text-micro font-bold tracking-extra-wide uppercase text-text-secondary">
          Instructions
        </h2>
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
            className="flex items-center justify-center h-10.5 rounded-lg gap-2 bg-accent-blue/6 border-1.5 border-accent-blue"
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
        <div className="hidden lg:block flex-1" />
        <Link
          href="/merger"
          aria-disabled={!canContinueToMerge}
          className={cn(
            "flex items-center justify-center h-10.5 rounded-lg text-label font-semibold",
            canContinueToMerge
              ? "border border-white/10 text-text-primary hover:bg-white/5"
              : "opacity-40 border border-white/10 text-text-tertiary pointer-events-none",
          )}
        >
          Continue to Merge
        </Link>
      </aside>
    </div>
  );
};
