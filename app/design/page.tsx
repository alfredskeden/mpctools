"use client";

import { useDesignWorkflow } from "@/hooks/use-design-workflow";
import { SizeSelector } from "@/components/design/size-selector";
import { ImageUploader } from "@/components/design/image-uploader";
import { AutoProcessCard } from "@/components/design/auto-process-card";
import { OutpaintHandoff } from "@/components/design/outpaint-handoff";
import { AutoMergeCard } from "@/components/design/auto-merge-card";
import { FinalResultCard } from "@/components/design/final-result-card";
import { StepCircle } from "@/components/ui/StepCircle";
import type { StepStatus } from "@/lib/step-types";

const STAGE_LABELS = [
  "Text size",
  "Upload",
  "Process",
  "Outpaint",
  "Merge",
  "Result",
] as const;

function getStageStatuses(currentStage: number): StepStatus[] {
  return STAGE_LABELS.map((_, i) => {
    const stageNum = i + 1;
    if (stageNum < currentStage) return "completed";
    if (stageNum === currentStage) return "active";
    return "upcoming";
  });
}

export default function DesignPage() {
  const {
    state,
    selectTextBoxSize,
    uploadOriginal,
    uploadOutpaint,
    downloadResult,
    reset,
    handshakePrompt,
    outpaintCommand,
  } = useDesignWorkflow();

  const statuses = getStageStatuses(state.stage);

  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6">
        <nav
          aria-label="Design steps"
          className="flex items-center justify-center gap-2"
        >
          {STAGE_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-6 ${
                    statuses[i] === "upcoming"
                      ? "bg-surface-muted"
                      : "bg-accent-blue"
                  }`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <StepCircle status={statuses[i]} number={i + 1} />
                <span className="hidden text-caption text-text-secondary sm:inline">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </nav>

        {state.stage >= 1 && (
          <section
            aria-label="Text size selection"
            data-stage="1"
            className={state.stage > 1 ? "opacity-50" : undefined}
          >
            <SizeSelector
              selected={state.textBoxSize}
              onSelect={selectTextBoxSize}
            />
          </section>
        )}

        {state.stage >= 2 && state.stage <= 2 && (
          <section aria-label="Image upload" data-stage="2">
            <ImageUploader onUpload={uploadOriginal} />
          </section>
        )}

        {state.stage >= 2 && state.originalFileName && state.stage > 2 && (
          <section
            aria-label="Uploaded image"
            data-stage="2-summary"
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised p-3 opacity-50"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-status-success-dark">
              <svg
                className="size-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm text-text-secondary">
              {state.originalFileName}
            </span>
          </section>
        )}

        {state.stage >= 3 && state.stage <= 4 && (
          <section aria-label="Auto processing" data-stage="3">
            <AutoProcessCard
              isProcessing={state.isProcessing}
              grayBorderDataUrl={state.grayBorderDataUrl}
              fileName={state.originalFileName}
            />
          </section>
        )}

        {state.stage >= 4 && state.stage <= 4 && (
          <section aria-label="Outpaint handoff" data-stage="4">
            <OutpaintHandoff
              handshakePrompt={handshakePrompt}
              outpaintCommand={outpaintCommand}
              grayBorderDataUrl={state.grayBorderDataUrl}
              dewatermarkPhase={state.dewatermarkPhase}
              dewatermarkError={state.dewatermarkError}
              onUploadOutpaint={uploadOutpaint}
            />
          </section>
        )}

        {state.stage >= 5 && state.stage <= 5 && (
          <section aria-label="Auto merge" data-stage="5">
            <AutoMergeCard mergePhase={state.mergePhase} />
          </section>
        )}

        {state.stage >= 6 && state.mergedCanvasDataUrl && (
          <section aria-label="Final result" data-stage="6">
            <FinalResultCard
              mergedCanvasDataUrl={state.mergedCanvasDataUrl}
              isDownloaded={state.isDownloaded}
              originalFileName={state.originalFileName}
              onDownload={downloadResult}
              onReset={reset}
            />
          </section>
        )}
      </div>
    </main>
  );
}
