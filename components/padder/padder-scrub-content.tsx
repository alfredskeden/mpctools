"use client";

import { useState } from "react";
import Link from "next/link";
import { useCopyToClipboard } from "@/hooks/use-clipboard";
import {
  buildPadderHandshakePrompt,
  buildPadderCommand,
  readStoredPadderTarget,
  PADDER_ALTERNATE_COMMAND,
} from "@/lib/padder-prompts";

type PromptStepProps = {
  stepNumber: number;
  testId: string;
  title: string;
  prompt: string;
};

function PromptStep({ stepNumber, testId, title, prompt }: PromptStepProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3.5 rounded-lg border border-surface-border bg-surface-raised p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-accent-blue text-micro font-bold text-white">
            {stepNumber}
          </span>
          <h2 className="text-label font-semibold tracking-wide text-text-primary">
            {title}
          </h2>
        </div>
        <button
          type="button"
          data-testid={testId}
          data-copied={copied}
          onClick={() => copy(prompt)}
          className="rounded-md bg-accent-blue px-3.5 py-1.5 text-xs font-medium text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-text-code">
        {prompt}
      </pre>
    </section>
  );
}

export function PadderScrubContent() {
  // Read once, lazily — sessionStorage is never touched during SSR.
  const [target] = useState(() => readStoredPadderTarget());

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-ground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-micro font-bold tracking-extra-wide uppercase text-accent-blue">
            Prompt Guide
          </h1>
          <p className="text-sm text-text-secondary">
            Feed your padded scan to Gemini with these prompts to start
            scrubbing.
          </p>
          <dl className="flex gap-4 text-xs text-text-secondary">
            <div className="flex gap-2">
              <dt>Canvas</dt>
              <dd className="font-mono text-text-primary">
                <span data-testid="padder-target-width">{target.width}</span>
                {" x "}
                <span data-testid="padder-target-height">{target.height}</span>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt>Ratio</dt>
              <dd
                className="font-mono text-text-primary"
                data-testid="padder-target-ratio"
              >
                {target.ratioLabel}
              </dd>
            </div>
          </dl>
        </header>

        <PromptStep
          stepNumber={1}
          testId="padder-copy-handshake"
          title="The handshake"
          prompt={buildPadderHandshakePrompt(target)}
        />

        <PromptStep
          stepNumber={2}
          testId="padder-copy-command"
          title="The command"
          prompt={buildPadderCommand(target)}
        />

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-surface-border" />
          <span className="text-micro font-bold tracking-extra-wide uppercase text-text-tertiary">
            or
          </span>
          <span className="h-px flex-1 bg-surface-border" />
        </div>

        <PromptStep
          stepNumber={2}
          testId="padder-copy-alternate"
          title="The short command"
          prompt={PADDER_ALTERNATE_COMMAND}
        />

        <Link
          href="/padder"
          data-testid="padder-back-link"
          className="flex h-9.5 w-full items-center justify-center rounded-lg border border-surface-border text-sm font-medium text-text-primary"
        >
          Back to the padder
        </Link>
      </div>
    </main>
  );
}
