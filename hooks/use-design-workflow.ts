"use client";

import { useReducer, useCallback, useEffect } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";
import { exportFullResolution } from "@/lib/prep-renderer";
import {
  VERTICAL_PRESET_CENTERS,
  type VerticalPreset,
} from "@/hooks/use-prep-workflow";
import {
  buildHandshakePrompt,
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
} from "@/hooks/use-outpaint-workflow";
import { analyzeGuide } from "@/lib/merger-utils";
import { downloadPsd } from "@/lib/psd-export";
import { drawMergerScene } from "@/components/merger/MergerCanvas";
import type { MergerState } from "@/hooks/use-merger-workflow";

export type DesignStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CanvasSizePreset = "default" | "classic-borderless";

export const DESIGN_CANVAS_PRESETS: Record<
  CanvasSizePreset,
  { label: string; width: number; height: number }
> = {
  default: { label: "Default", width: 3520, height: 4800 },
  "classic-borderless": { label: "Classic borderless", width: 3712, height: 4608 },
};

export type TextBoxSize = VerticalPreset;

export const TEXTBOX_AVAILABLE_HEIGHTS: Record<TextBoxSize, number> = {
  tall: 1857,
  normal: 2180,
  short: 2596,
  medium: 2374,
};

export const CLASSIC_BORDERLESS_TEXTBOX_HEIGHTS: Record<TextBoxSize, number> = {
  tall: 2116,
  normal: 2301,
  short: 2747,
  medium: 2506,
};

export type MergeAnalysis = {
  ogPosition: { x: number; y: number; w: number; h: number };
  canvasW: number;
  canvasH: number;
};

export type DesignState = {
  stage: DesignStage;
  canvasSize: CanvasSizePreset | null;
  textBoxSize: TextBoxSize | null;
  originalImage: HTMLImageElement | null;
  originalFileName: string | null;
  grayBorderDataUrl: string | null;
  isProcessing: boolean;
  outpaintPhase: "idle" | "processing" | "done" | "error";
  outpaintImage: HTMLImageElement | null;
  outpaintError: string | null;
  mergePhase: "idle" | "processing" | "done";
  mergedCanvasDataUrl: string | null;
  mergeAnalysis: MergeAnalysis | null;
  isDownloaded: boolean;
};

export type DesignAction =
  | { type: "SELECT_CANVAS_SIZE"; payload: CanvasSizePreset }
  | { type: "SELECT_TEXT_BOX_SIZE"; payload: TextBoxSize }
  | {
      type: "UPLOAD_ORIGINAL";
      payload: { image: HTMLImageElement; fileName: string };
    }
  | { type: "START_AUTO_PROCESS" }
  | { type: "AUTO_PROCESS_COMPLETE"; payload: string }
  | { type: "UPLOAD_OUTPAINT_START" }
  | {
      type: "UPLOAD_OUTPAINT_COMPLETE";
      payload: HTMLImageElement;
    }
  | { type: "UPLOAD_OUTPAINT_ERROR"; payload: string }
  | { type: "START_MERGE" }
  | { type: "MERGE_COMPLETE"; payload: { dataUrl: string; mergeAnalysis: MergeAnalysis } }
  | { type: "MARK_DOWNLOADED" }
  | { type: "RESET" };

export const initialDesignState: DesignState = {
  stage: 1,
  canvasSize: null,
  textBoxSize: null,
  originalImage: null,
  originalFileName: null,
  grayBorderDataUrl: null,
  isProcessing: false,
  outpaintPhase: "idle",
  outpaintImage: null,
  outpaintError: null,
  mergePhase: "idle",
  mergedCanvasDataUrl: null,
  mergeAnalysis: null,
  isDownloaded: false,
};

export function designReducer(
  state: DesignState,
  action: DesignAction,
): DesignState {
  switch (action.type) {
    case "SELECT_CANVAS_SIZE":
      return {
        ...initialDesignState,
        stage: 2,
        canvasSize: action.payload,
      };
    case "SELECT_TEXT_BOX_SIZE":
      return {
        ...initialDesignState,
        stage: 3,
        canvasSize: state.canvasSize,
        textBoxSize: action.payload,
      };
    case "UPLOAD_ORIGINAL":
      return {
        ...state,
        stage: 4,
        originalImage: action.payload.image,
        originalFileName: action.payload.fileName,
        isProcessing: true,
        grayBorderDataUrl: null,
        outpaintPhase: "idle",
        outpaintImage: null,
        outpaintError: null,
        mergePhase: "idle",
        mergedCanvasDataUrl: null,
        isDownloaded: false,
      };
    case "START_AUTO_PROCESS":
      return {
        ...state,
        isProcessing: true,
      };
    case "AUTO_PROCESS_COMPLETE":
      return {
        ...state,
        stage: 5,
        isProcessing: false,
        grayBorderDataUrl: action.payload,
      };
    case "UPLOAD_OUTPAINT_START":
      return {
        ...state,
        outpaintPhase: "processing",
        outpaintImage: null,
        outpaintError: null,
      };
    case "UPLOAD_OUTPAINT_COMPLETE":
      return {
        ...state,
        stage: 6,
        outpaintPhase: "done",
        outpaintImage: action.payload,
        mergePhase: "processing",
      };
    case "UPLOAD_OUTPAINT_ERROR":
      return {
        ...state,
        outpaintPhase: "error",
        outpaintError: action.payload,
      };
    case "START_MERGE":
      return {
        ...state,
        mergePhase: "processing",
      };
    case "MERGE_COMPLETE":
      return {
        ...state,
        stage: 7,
        mergePhase: "done",
        mergedCanvasDataUrl: action.payload.dataUrl,
        mergeAnalysis: action.payload.mergeAnalysis,
      };
    case "MARK_DOWNLOADED":
      return {
        ...state,
        isDownloaded: true,
      };
    case "RESET":
      return initialDesignState;
    default:
      return state;
  }
}

export function computeAutoPosition(
  image: HTMLImageElement,
  textBoxSize: TextBoxSize,
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT,
): { position: { x: number; y: number }; scale: number } {
  const heightsMap =
    canvasHeight === DESIGN_CANVAS_PRESETS["classic-borderless"].height
      ? CLASSIC_BORDERLESS_TEXTBOX_HEIGHTS
      : TEXTBOX_AVAILABLE_HEIGHTS;
  const availableHeight = heightsMap[textBoxSize];
  const scale = availableHeight / image.naturalHeight;

  const x = Math.round((canvasWidth - image.naturalWidth * scale) / 2);

  const pixelFromBottom = VERTICAL_PRESET_CENTERS[textBoxSize];
  const scaleX = canvasWidth / CANVAS_WIDTH;
  const yCanvas = Math.round((CANVAS_HEIGHT - pixelFromBottom) * scaleX);
  const imgH = image.naturalHeight * scale;
  const y = Math.max(0, Math.min(Math.round(yCanvas - imgH / 2), canvasHeight - imgH));

  return { position: { x, y }, scale };
}

function buildMergerState(
  ogImage: HTMLImageElement,
  outpaintImage: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  ogX: number,
  ogY: number,
): MergerState {
  return {
    currentStep: 3,
    ogImage,
    ogFileName: null,
    ogFileSize: null,
    guideImage: null,
    guideFileName: null,
    guideFileSize: null,
    outpaintImage,
    outpaintFileName: null,
    outpaintFileSize: null,
    canvasW,
    canvasH,
    ogPosition: {
      x: ogX,
      y: ogY,
      w: ogImage.naturalWidth,
      h: ogImage.naturalHeight,
    },
    featherStrength: 40,
    irregMagnitude: 100,
    irregDensity: 100,
    irregRadius: 0,
    irregBlur: 12,
    irregSeed: 42,
    isDownloaded: false,
  };
}

export function useDesignWorkflow() {
  const [state, dispatch] = useReducer(designReducer, initialDesignState);

  const selectCanvasSize = useCallback((preset: CanvasSizePreset) => {
    dispatch({ type: "SELECT_CANVAS_SIZE", payload: preset });
  }, []);

  const selectTextBoxSize = useCallback((size: TextBoxSize) => {
    dispatch({ type: "SELECT_TEXT_BOX_SIZE", payload: size });
  }, []);

  const uploadOriginal = useCallback(
    (image: HTMLImageElement, fileName: string) => {
      dispatch({ type: "UPLOAD_ORIGINAL", payload: { image, fileName } });
    },
    [],
  );

  // Stage 4: Auto-process effect
  useEffect(() => {
    if (
      state.stage !== 4 ||
      !state.isProcessing ||
      !state.originalImage ||
      !state.textBoxSize ||
      !state.canvasSize
    ) {
      return;
    }

    const image = state.originalImage;
    const textBoxSize = state.textBoxSize;
    const preset = DESIGN_CANVAS_PRESETS[state.canvasSize];

    const frameId = requestAnimationFrame(() => {
      const { position, scale } = computeAutoPosition(
        image,
        textBoxSize,
        preset.width,
        preset.height,
      );
      const dataUrl = exportFullResolution(
        image,
        position,
        scale,
        0,
        preset.width,
        preset.height,
      );
      dispatch({ type: "AUTO_PROCESS_COMPLETE", payload: dataUrl });
    });

    return () => cancelAnimationFrame(frameId);
  }, [state.stage, state.isProcessing, state.originalImage, state.textBoxSize, state.canvasSize]);

  const uploadOutpaint = useCallback((file: File) => {
    dispatch({ type: "UPLOAD_OUTPAINT_START" });

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      dispatch({ type: "UPLOAD_OUTPAINT_COMPLETE", payload: img });
    };
    /* v8 ignore start */
    img.onerror = () => {
      URL.revokeObjectURL(url);
      dispatch({
        type: "UPLOAD_OUTPAINT_ERROR",
        payload: "Failed to load outpaint image",
      });
    };
    /* v8 ignore stop */
    img.src = url;
  }, []);

  // Stage 6: Auto-merge effect
  useEffect(() => {
    if (
      state.stage !== 6 ||
      state.mergePhase !== "processing" ||
      !state.originalImage ||
      !state.grayBorderDataUrl ||
      !state.outpaintImage
    ) {
      return;
    }

    const ogImage = state.originalImage;
    const outpaintImage = state.outpaintImage;
    const grayBorderDataUrl = state.grayBorderDataUrl;
    let cancelled = false;

    const guideImg = new Image();
    guideImg.onload = () => {
      /* v8 ignore start */
      if (cancelled) return;
      /* v8 ignore stop */

      const guideCanvas = document.createElement("canvas");
      guideCanvas.width = guideImg.naturalWidth;
      guideCanvas.height = guideImg.naturalHeight;
      const gCtx = guideCanvas.getContext("2d");
      /* v8 ignore start */
      if (!gCtx) {
        dispatch({
          type: "UPLOAD_OUTPAINT_ERROR",
          payload: "Failed to create canvas context",
        });
        return;
      }
      /* v8 ignore stop */
      gCtx.drawImage(guideImg, 0, 0);

      const analysis = analyzeGuide(
        guideCanvas,
        ogImage.naturalWidth,
        ogImage.naturalHeight,
      );

      if (!analysis) {
        dispatch({
          type: "UPLOAD_OUTPAINT_ERROR",
          payload: "Could not analyze guide image",
        });
        return;
      }

      const mergerState = buildMergerState(
        ogImage,
        outpaintImage,
        analysis.canvasW,
        analysis.canvasH,
        analysis.ogX,
        analysis.ogY,
      );

      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = analysis.canvasW;
      resultCanvas.height = analysis.canvasH;
      const rCtx = resultCanvas.getContext("2d");
      /* v8 ignore start */
      if (!rCtx) {
        dispatch({
          type: "UPLOAD_OUTPAINT_ERROR",
          payload: "Failed to create result canvas context",
        });
        return;
      }
      /* v8 ignore stop */

      drawMergerScene(rCtx, mergerState, 1);

      const dataUrl = resultCanvas.toDataURL("image/png");
      dispatch({
        type: "MERGE_COMPLETE",
        payload: {
          dataUrl,
          mergeAnalysis: {
            ogPosition: mergerState.ogPosition,
            canvasW: analysis.canvasW,
            canvasH: analysis.canvasH,
          },
        },
      });
    };
    guideImg.src = grayBorderDataUrl;

    return () => {
      cancelled = true;
    };
  }, [
    state.stage,
    state.mergePhase,
    state.originalImage,
    state.grayBorderDataUrl,
    state.outpaintImage,
  ]);

  const exportPsd = useCallback(
    (fileName: string) => {
      if (
        !state.originalImage ||
        !state.outpaintImage ||
        !state.mergeAnalysis
      )
        return;

      downloadPsd(
        {
          ogImage: state.originalImage,
          outpaintImage: state.outpaintImage,
          ogPosition: state.mergeAnalysis.ogPosition,
          canvasW: state.mergeAnalysis.canvasW,
          canvasH: state.mergeAnalysis.canvasH,
          featherStrength: 40,
          irregMagnitude: 100,
          irregRadius: 0,
          irregDensity: 100,
          irregSeed: 42,
          irregBlur: 12,
        },
        fileName,
      );
    },
    [state.originalImage, state.outpaintImage, state.mergeAnalysis],
  );

  const downloadResult = useCallback(
    (fileName: string) => {
      if (!state.mergedCanvasDataUrl) return;

      const link = document.createElement("a");
      link.download = fileName;
      link.href = state.mergedCanvasDataUrl;
      link.click();

      dispatch({ type: "MARK_DOWNLOADED" });
    },
    [state.mergedCanvasDataUrl],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    selectCanvasSize,
    selectTextBoxSize,
    uploadOriginal,
    uploadOutpaint,
    downloadResult,
    exportPsd,
    reset,
    handshakePrompt: state.canvasSize
      ? buildHandshakePrompt(
          DESIGN_CANVAS_PRESETS[state.canvasSize].width,
          DESIGN_CANVAS_PRESETS[state.canvasSize].height,
        )
      : HANDSHAKE_PROMPT,
    outpaintCommand: OUTPAINT_COMMAND,
  };
}
