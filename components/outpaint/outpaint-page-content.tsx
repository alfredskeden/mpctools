"use client";

import {
  useOutpaintWorkflow,
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
} from "@/hooks/use-outpaint-workflow";
import { useCopyToClipboard } from "@/hooks/use-clipboard";
import { OutpaintStepCard } from "./outpaint-step-card";
import { CollapsedStep } from "./collapsed-step";
import { OutpaintActions } from "./outpaint-actions";

export function OutpaintPageContent() {
  const { state, sendHandshake, toggleHandshakeCollapse, canContinueToMerge } =
    useOutpaintWorkflow();
  const handshakeClipboard = useCopyToClipboard();
  const commandClipboard = useCopyToClipboard();

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
            codeText={HANDSHAKE_PROMPT}
            hintText='Copy this prompt, send it to Gemini, and wait for "Universal Neutral Extension Mode Locked. Ready for any input."'
            isActive={!state.handshakeSent}
            onCopy={() => handshakeClipboard.copy(HANDSHAKE_PROMPT)}
            copied={handshakeClipboard.copied}
          />
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
        <OutpaintActions
          handshakeSent={canContinueToMerge}
          onSendHandshake={sendHandshake}
        />
      </div>
    </div>
  );
}
