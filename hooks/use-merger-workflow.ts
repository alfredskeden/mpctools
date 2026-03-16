"use client";

import { useReducer, useCallback } from "react";
import { analyzeGuide, type GuideAnalysis } from "@/lib/merger-utils";

export type MergerStep = 1 | 2 | 3;

export type { StepStatus } from "@/lib/step-types";

export type MergerState = {
  currentStep: MergerStep;
  ogImage: HTMLImageElement | null;
  ogFileName: string | null;
  ogFileSize: number | null;
  guideImage: HTMLImageElement | null;
  guideFileName: string | null;
  guideFileSize: number | null;
  outpaintImage: HTMLImageElement | null;
  outpaintFileName: string | null;
  outpaintFileSize: number | null;
  canvasW: number;
  canvasH: number;
  ogPosition: { x: number; y: number; w: number; h: number };
  featherStrength: number;
  isDownloaded: boolean;
};

type MergerAction =
  | {
      type: "UPLOAD_OG";
      payload: {
        image: HTMLImageElement;
        fileName: string;
        fileSize: number;
      };
    }
  | {
      type: "UPLOAD_GUIDE";
      payload: {
        image: HTMLImageElement;
        fileName: string;
        fileSize: number;
        analysis: GuideAnalysis;
      };
    }
  | {
      type: "UPLOAD_OUTPAINT";
      payload: {
        image: HTMLImageElement;
        fileName: string;
        fileSize: number;
      };
    }
  | { type: "SET_FEATHER"; payload: number }
  | { type: "MARK_DOWNLOADED" }
  | { type: "RESET" };

export const initialState: MergerState = {
  currentStep: 1,
  ogImage: null,
  ogFileName: null,
  ogFileSize: null,
  guideImage: null,
  guideFileName: null,
  guideFileSize: null,
  outpaintImage: null,
  outpaintFileName: null,
  outpaintFileSize: null,
  canvasW: 0,
  canvasH: 0,
  ogPosition: { x: 0, y: 0, w: 0, h: 0 },
  featherStrength: 40,
  isDownloaded: false,
};

export function mergerReducer(
  state: MergerState,
  action: MergerAction,
): MergerState {
  switch (action.type) {
    case "UPLOAD_OG": {
      const natW = action.payload.image.naturalWidth;
      const natH = action.payload.image.naturalHeight;
      return {
        ...state,
        currentStep: 2,
        ogImage: action.payload.image,
        ogFileName: action.payload.fileName,
        ogFileSize: action.payload.fileSize,
        canvasW: natW,
        canvasH: natH,
        ogPosition: { x: 0, y: 0, w: natW, h: natH },
        guideImage: null,
        guideFileName: null,
        guideFileSize: null,
        outpaintImage: null,
        outpaintFileName: null,
        outpaintFileSize: null,
        isDownloaded: false,
      };
    }
    case "UPLOAD_GUIDE": {
      if (!state.ogImage) return state;
      const ogW = state.ogImage.naturalWidth;
      const ogH = state.ogImage.naturalHeight;
      const { analysis } = action.payload;
      return {
        ...state,
        currentStep: 3,
        guideImage: action.payload.image,
        guideFileName: action.payload.fileName,
        guideFileSize: action.payload.fileSize,
        canvasW: analysis.canvasW,
        canvasH: analysis.canvasH,
        ogPosition: {
          x: analysis.ogX,
          y: analysis.ogY,
          w: ogW,
          h: ogH,
        },
        outpaintImage: null,
        outpaintFileName: null,
        outpaintFileSize: null,
        isDownloaded: false,
      };
    }
    case "UPLOAD_OUTPAINT":
      return {
        ...state,
        outpaintImage: action.payload.image,
        outpaintFileName: action.payload.fileName,
        outpaintFileSize: action.payload.fileSize,
        isDownloaded: false,
      };
    case "SET_FEATHER":
      return {
        ...state,
        featherStrength: action.payload,
      };
    case "MARK_DOWNLOADED":
      return {
        ...state,
        isDownloaded: true,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function getMergerStepStatuses(currentStep: MergerStep): StepStatus[] {
  return [1, 2, 3].map((step) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "upcoming";
  }) as StepStatus[];
}

export function useMergerWorkflow() {
  const [state, dispatch] = useReducer(mergerReducer, initialState);

  const uploadOg = useCallback(
    (image: HTMLImageElement, fileName: string, fileSize: number) => {
      dispatch({
        type: "UPLOAD_OG",
        payload: { image, fileName, fileSize },
      });
    },
    [],
  );

  const uploadGuide = useCallback(
    (
      image: HTMLImageElement,
      fileName: string,
      fileSize: number,
      guideCanvas: HTMLCanvasElement,
    ) => {
      if (!state.ogImage) return;
      const ogW = state.ogImage.naturalWidth;
      const ogH = state.ogImage.naturalHeight;
      const analysis = analyzeGuide(guideCanvas, ogW, ogH);
      if (!analysis) return;
      dispatch({
        type: "UPLOAD_GUIDE",
        payload: { image, fileName, fileSize, analysis },
      });
    },
    [state.ogImage],
  );

  const uploadOutpaint = useCallback(
    (image: HTMLImageElement, fileName: string, fileSize: number) => {
      dispatch({
        type: "UPLOAD_OUTPAINT",
        payload: { image, fileName, fileSize },
      });
    },
    [],
  );

  const setFeather = useCallback((value: number) => {
    dispatch({ type: "SET_FEATHER", payload: value });
  }, []);

  const markDownloaded = useCallback(() => {
    dispatch({ type: "MARK_DOWNLOADED" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const canDownload =
    state.ogImage !== null &&
    state.guideImage !== null &&
    state.outpaintImage !== null;
  const stepStatuses = getMergerStepStatuses(state.currentStep);

  return {
    state,
    uploadOg,
    uploadGuide,
    uploadOutpaint,
    setFeather,
    markDownloaded,
    reset,
    canDownload,
    stepStatuses,
  };
}
