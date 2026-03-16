"use client";

import { useState, useCallback, useEffect } from "react";

type UseCarouselOptions = {
  totalSteps: number;
  currentStepIndex: number;
};

type UseCarouselReturn = {
  visibleIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
};

export function useCarousel({
  totalSteps,
  currentStepIndex,
}: UseCarouselOptions): UseCarouselReturn {
  const [visibleIndex, setVisibleIndex] = useState(currentStepIndex);

  useEffect(() => {
    setVisibleIndex(currentStepIndex);
  }, [currentStepIndex]);

  const canGoBack = visibleIndex > 0;
  const canGoForward = visibleIndex < totalSteps - 1;

  const goBack = useCallback(() => {
    setVisibleIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goForward = useCallback(() => {
    setVisibleIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  return { visibleIndex, canGoBack, canGoForward, goBack, goForward };
}
