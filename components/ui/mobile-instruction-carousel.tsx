"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/lib/step-types";
import { StepCircle } from "@/components/ui/StepCircle";
import { useCarousel } from "@/hooks/use-carousel";

export type CarouselStep = {
  number: number;
  title: string;
  status: StepStatus;
  content: ReactNode;
};

type MobileInstructionCarouselProps = {
  steps: CarouselStep[];
  currentStepIndex: number;
  ariaLabel?: string;
};

export function MobileInstructionCarousel({
  steps,
  currentStepIndex,
  ariaLabel = "Instructions",
}: MobileInstructionCarouselProps) {
  const { visibleIndex, canGoBack, canGoForward, goBack, goForward } =
    useCarousel({
      totalSteps: steps.length,
      currentStepIndex,
    });

  const currentStep = steps[visibleIndex];

  return (
    <div className="md:hidden" aria-label={ariaLabel} role="region">
      {/* Nav header row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Previous step"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-overlay",
            !canGoBack && "opacity-35",
          )}
        >
          <ChevronLeft className="size-4 text-text-secondary" />
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          <StepCircle status={currentStep.status} number={currentStep.number} />
          <p
            className={cn(
              "truncate text-sm font-medium leading-6",
              currentStep.status === "upcoming"
                ? "text-text-secondary"
                : "text-text-primary",
            )}
          >
            {currentStep.title}
          </p>
        </div>

        <button
          type="button"
          onClick={goForward}
          disabled={!canGoForward}
          aria-label="Next step"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-overlay",
            !canGoForward && "opacity-35",
          )}
        >
          <ChevronRight className="size-4 text-text-secondary" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={cn(
              "size-1.5 rounded-full",
              index === visibleIndex ? "bg-accent-blue" : "bg-surface-muted",
            )}
          />
        ))}
      </div>

      {/* Content area */}
      <div
        className={cn(
          "mt-4",
          currentStep.status === "upcoming" && "opacity-35",
        )}
      >
        {currentStep.content}
      </div>
    </div>
  );
}
