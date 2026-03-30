"use client";

import { useReducer, useCallback, useEffect } from "react";
import {
  calculateInitialScale,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@/lib/canvas-utils";
import { track } from "@/lib/analytics";
import { StepStatus } from "./use-merger-workflow";

export const OVERLAY_OPTIONS = [
  { id: "normal", label: "Normal", filename: "normal.png" },
  { id: "medium", label: "Medium", filename: "medium.png" },
  { id: "short", label: "Short", filename: "short.png" },
  {
    id: "tall_normal",
    label: "Tall Normal",
    filename: "tall_normal_mtg_box_size.png",
  },
  {
    id: "black_bottom",
    label: "Black Bottom",
    filename: "black_bottom_border.png",
  },
] as const;

export type PrepStep = 1 | 2 | 3;

export type { StepStatus } from "@/lib/step-types";

export type Algorithm = "detail-preserving" | "standard";

export type VerticalPreset = "short" | "medium" | "normal" | "tall";

export const VERTICAL_PRESET_CENTERS: Record<VerticalPreset, number> = {
  short: 2836,
  medium: 2947,
  normal: 3044,
  tall: 3143,
};

export const CANVAS_SIZE_PRESETS = [
  { label: "Default", width: 3520, height: 4800 },
  { label: "Classic borderless", width: 3712, height: 4608 },
  { label: "1:1", width: 2048, height: 2048 },
  { label: "4:3", width: 3264, height: 2448 },
  { label: "16:9", width: 3264, height: 1836 },
  { label: "3:4", width: 2448, height: 3264 },
  { label: "9:16", width: 1836, height: 3264 },
] as const;

export type PrepState = {
  currentStep: PrepStep;
  uploadedImage: string | null;
  imageElement: HTMLImageElement | null;
  fileName: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  isPositioned: boolean;
  isDownloaded: boolean;
  selectedOverlays: string[];
  canvasDataUrl: string | null;
  canvasWidth: number;
  canvasHeight: number;
  dpiOverride: number | null;
  overlayOpacities: Record<string, number>;
  keepAspectRatio: boolean;
  algorithm: Algorithm;
  overlayNativeDimensions: { width: number; height: number } | null;
};

type PrepAction =
  | {
      type: "UPLOAD_IMAGE";
      payload: { dataUrl: string; element: HTMLImageElement; fileName: string };
    }
  | { type: "UPDATE_POSITION"; payload: { x: number; y: number } }
  | { type: "UPDATE_SCALE"; payload: number }
  | { type: "UPDATE_ROTATION"; payload: number }
  | { type: "MARK_POSITIONED" }
  | { type: "MARK_DOWNLOADED" }
  | { type: "TOGGLE_OVERLAY"; payload: string }
  | { type: "SET_CANVAS_DATA_URL"; payload: string }
  | { type: "RESET" }
  | { type: "REPOSITION" }
  | { type: "SET_CANVAS_SIZE"; payload: { width: number; height: number } }
  | { type: "SET_DPI_OVERRIDE"; payload: number | null }
  | { type: "SET_OVERLAY_OPACITY"; payload: { id: string; opacity: number } }
  | { type: "SET_KEEP_ASPECT_RATIO"; payload: boolean }
  | { type: "SET_ALGORITHM"; payload: Algorithm }
  | { type: "SET_IMAGE_DIMENSIONS"; payload: { width: number; height: number } }
  | { type: "CENTER_HORIZONTAL" }
  | { type: "CENTER_VERTICAL" }
  | { type: "FIT_WIDTH" }
  | { type: "FIT_HEIGHT" }
  | { type: "SET_VERTICAL_PRESET"; payload: VerticalPreset }
  | {
      type: "SET_OVERLAY_NATIVE_DIMENSIONS";
      payload: { width: number; height: number };
    };

const initialState: PrepState = {
  currentStep: 1,
  uploadedImage: null,
  imageElement: null,
  fileName: null,
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  isPositioned: false,
  isDownloaded: false,
  selectedOverlays: [],
  canvasDataUrl: null,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  dpiOverride: null,
  overlayOpacities: {},
  keepAspectRatio: true,
  algorithm: "detail-preserving",
  overlayNativeDimensions: null,
};

export function prepReducer(state: PrepState, action: PrepAction): PrepState {
  switch (action.type) {
    case "UPLOAD_IMAGE": {
      const defaultOverlays = ["tall_normal", "black_bottom"];
      const opacities: Record<string, number> = {};
      for (const id of defaultOverlays) {
        opacities[id] = 100;
      }
      const el = action.payload.element;
      const newScale = calculateInitialScale(el, {
        width: state.canvasWidth,
        height: state.canvasHeight,
      });
      return {
        ...state,
        currentStep: 2,
        uploadedImage: action.payload.dataUrl,
        imageElement: el,
        fileName: action.payload.fileName,
        position: {
          x: (state.canvasWidth - el.width * newScale) / 2,
          y: (state.canvasHeight - el.height * newScale) / 2,
        },
        scale: newScale,
        rotation: 0,
        isPositioned: false,
        isDownloaded: false,
        selectedOverlays: defaultOverlays,
        overlayOpacities: opacities,
      };
    }
    case "UPDATE_POSITION":
      return {
        ...state,
        position: action.payload,
      };
    case "UPDATE_SCALE": {
      const newScale = action.payload;
      if (!state.imageElement) {
        return { ...state, scale: newScale };
      }
      const currentW = state.imageElement.width * state.scale;
      const currentH = state.imageElement.height * state.scale;
      const cx = state.position.x + currentW / 2;
      const cy = state.position.y + currentH / 2;
      const newW = state.imageElement.width * newScale;
      const newH = state.imageElement.height * newScale;
      return {
        ...state,
        scale: newScale,
        position: {
          x: Math.round(cx - newW / 2),
          y: Math.round(cy - newH / 2),
        },
      };
    }
    case "UPDATE_ROTATION":
      return {
        ...state,
        rotation: action.payload,
      };
    case "MARK_POSITIONED":
      return {
        ...state,
        currentStep: 3,
        isPositioned: true,
      };
    case "MARK_DOWNLOADED":
      return {
        ...state,
        isDownloaded: true,
      };
    case "TOGGLE_OVERLAY": {
      const isAdding = !state.selectedOverlays.includes(action.payload);
      const newOpacities = { ...state.overlayOpacities };
      if (isAdding && !(action.payload in newOpacities)) {
        newOpacities[action.payload] = 100;
      }
      return {
        ...state,
        selectedOverlays: isAdding
          ? [...state.selectedOverlays, action.payload]
          : state.selectedOverlays.filter((id) => id !== action.payload),
        overlayOpacities: newOpacities,
      };
    }
    case "SET_CANVAS_DATA_URL":
      return {
        ...state,
        canvasDataUrl: action.payload,
      };
    case "RESET":
      return initialState;
    case "REPOSITION":
      return {
        ...state,
        currentStep: 2 as PrepStep,
        isPositioned: false,
        isDownloaded: false,
      };
    case "SET_CANVAS_SIZE":
      return {
        ...state,
        canvasWidth: action.payload.width,
        canvasHeight: action.payload.height,
      };
    case "SET_DPI_OVERRIDE": {
      const newDpi = action.payload;
      if (!newDpi || !state.imageElement) {
        return { ...state, dpiOverride: newDpi };
      }
      const newScale = 1200 / newDpi;
      const currentW = state.imageElement.width * state.scale;
      const currentH = state.imageElement.height * state.scale;
      const cx = state.position.x + currentW / 2;
      const cy = state.position.y + currentH / 2;
      const newW = state.imageElement.width * newScale;
      const newH = state.imageElement.height * newScale;
      return {
        ...state,
        dpiOverride: newDpi,
        scale: newScale,
        position: {
          x: Math.round(cx - newW / 2),
          y: Math.round(cy - newH / 2),
        },
      };
    }
    case "SET_OVERLAY_OPACITY":
      return {
        ...state,
        overlayOpacities: {
          ...state.overlayOpacities,
          [action.payload.id]: action.payload.opacity,
        },
      };
    case "SET_KEEP_ASPECT_RATIO":
      return {
        ...state,
        keepAspectRatio: action.payload,
      };
    case "SET_ALGORITHM":
      return {
        ...state,
        algorithm: action.payload,
      };
    case "SET_IMAGE_DIMENSIONS": {
      if (!state.imageElement) return state;
      const newScale = action.payload.width / state.imageElement.width;
      const currentW = state.imageElement.width * state.scale;
      const currentH = state.imageElement.height * state.scale;
      const cx = state.position.x + currentW / 2;
      const cy = state.position.y + currentH / 2;
      const newW = state.imageElement.width * newScale;
      const newH = state.imageElement.height * newScale;
      return {
        ...state,
        scale: newScale,
        position: {
          x: Math.round(cx - newW / 2),
          y: Math.round(cy - newH / 2),
        },
      };
    }
    case "CENTER_HORIZONTAL": {
      if (!state.imageElement) return state;
      return {
        ...state,
        position: {
          ...state.position,
          x: (state.canvasWidth - state.imageElement.width * state.scale) / 2,
        },
      };
    }
    case "CENTER_VERTICAL": {
      if (!state.imageElement) return state;
      return {
        ...state,
        position: {
          ...state.position,
          y: (state.canvasHeight - state.imageElement.height * state.scale) / 2,
        },
      };
    }
    case "FIT_WIDTH": {
      if (!state.imageElement) return state;
      const fitScale = state.canvasWidth / state.imageElement.width;
      return {
        ...state,
        scale: fitScale,
        position: {
          x: 0,
          y: (state.canvasHeight - state.imageElement.height * fitScale) / 2,
        },
      };
    }
    case "FIT_HEIGHT": {
      if (!state.imageElement) return state;
      const fitScale = state.canvasHeight / state.imageElement.height;
      return {
        ...state,
        scale: fitScale,
        position: {
          x: (state.canvasWidth - state.imageElement.width * fitScale) / 2,
          y: 0,
        },
      };
    }
    case "SET_VERTICAL_PRESET": {
      if (!state.imageElement) return state;
      const pixelFromBottom = VERTICAL_PRESET_CENTERS[action.payload];
      const scaleY = state.canvasHeight / CANVAS_HEIGHT;
      const yCanvas = Math.round((CANVAS_HEIGHT - pixelFromBottom) * scaleY);
      const imgH = state.imageElement.height * state.scale;
      const newY = Math.round(yCanvas - imgH / 2);
      const clampedY = Math.max(0, Math.min(newY, state.canvasHeight - imgH));
      return {
        ...state,
        position: {
          ...state.position,
          y: clampedY,
        },
      };
    }
    case "SET_OVERLAY_NATIVE_DIMENSIONS":
      return {
        ...state,
        overlayNativeDimensions: action.payload,
      };
    default:
      return state;
  }
}

export function getStepStatuses(currentStep: PrepStep): StepStatus[] {
  return [1, 2, 3].map((step) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "upcoming";
  }) as StepStatus[];
}

export const PREP_CANVAS_SIZE_KEY = "prep-canvas-size";

export function usePrepWorkflow() {
  const [state, dispatch] = useReducer(prepReducer, initialState);

  useEffect(() => {
    sessionStorage.setItem(
      PREP_CANVAS_SIZE_KEY,
      JSON.stringify({ width: state.canvasWidth, height: state.canvasHeight }),
    );
  }, [state.canvasWidth, state.canvasHeight]);

  const uploadImage = useCallback(
    (dataUrl: string, element: HTMLImageElement, fileName: string) => {
      dispatch({
        type: "UPLOAD_IMAGE",
        payload: { dataUrl, element, fileName },
      });
      track("prep_image_uploaded", {
        fileName,
        width: element.width,
        height: element.height,
      });
    },
    [],
  );

  const updatePosition = useCallback((x: number, y: number) => {
    dispatch({ type: "UPDATE_POSITION", payload: { x, y } });
  }, []);

  const updateScale = useCallback((scale: number) => {
    dispatch({ type: "UPDATE_SCALE", payload: scale });
  }, []);

  const updateRotation = useCallback((rotation: number) => {
    dispatch({ type: "UPDATE_ROTATION", payload: rotation });
  }, []);

  const markPositioned = useCallback(() => {
    dispatch({ type: "MARK_POSITIONED" });
    track("prep_image_positioned");
  }, []);

  const markDownloaded = useCallback(() => {
    dispatch({ type: "MARK_DOWNLOADED" });
    track("prep_image_downloaded");
  }, []);

  const toggleOverlay = useCallback((overlay: string) => {
    dispatch({ type: "TOGGLE_OVERLAY", payload: overlay });
    track("prep_overlay_toggled", { overlay });
  }, []);

  const setCanvasDataUrl = useCallback((dataUrl: string) => {
    dispatch({ type: "SET_CANVAS_DATA_URL", payload: dataUrl });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const resetWorkflow = useCallback(() => {
    dispatch({ type: "REPOSITION" });
  }, []);

  const setCanvasSize = useCallback((width: number, height: number) => {
    dispatch({ type: "SET_CANVAS_SIZE", payload: { width, height } });
    track("prep_canvas_size_set", { width, height });
  }, []);

  const setDpiOverride = useCallback((dpi: number | null) => {
    dispatch({ type: "SET_DPI_OVERRIDE", payload: dpi });
    if (dpi !== null) track("prep_dpi_override_set", { dpi });
  }, []);

  const setOverlayOpacity = useCallback((id: string, opacity: number) => {
    dispatch({ type: "SET_OVERLAY_OPACITY", payload: { id, opacity } });
  }, []);

  const setKeepAspectRatio = useCallback((keep: boolean) => {
    dispatch({ type: "SET_KEEP_ASPECT_RATIO", payload: keep });
  }, []);

  const setAlgorithm = useCallback((algorithm: Algorithm) => {
    dispatch({ type: "SET_ALGORITHM", payload: algorithm });
    track("prep_algorithm_set", { algorithm });
  }, []);

  const setImageDimensions = useCallback((width: number, height: number) => {
    dispatch({ type: "SET_IMAGE_DIMENSIONS", payload: { width, height } });
  }, []);

  const centerHorizontal = useCallback(() => {
    dispatch({ type: "CENTER_HORIZONTAL" });
    track("prep_alignment_used", { action: "center_horizontal" });
  }, []);

  const centerVertical = useCallback(() => {
    dispatch({ type: "CENTER_VERTICAL" });
    track("prep_alignment_used", { action: "center_vertical" });
  }, []);

  const fitWidth = useCallback(() => {
    dispatch({ type: "FIT_WIDTH" });
    track("prep_alignment_used", { action: "fit_width" });
  }, []);

  const fitHeight = useCallback(() => {
    dispatch({ type: "FIT_HEIGHT" });
    track("prep_alignment_used", { action: "fit_height" });
  }, []);

  const setVerticalPreset = useCallback((preset: VerticalPreset) => {
    dispatch({ type: "SET_VERTICAL_PRESET", payload: preset });
    track("prep_vertical_preset_used", { preset });
  }, []);

  const setOverlayNativeDimensions = useCallback(
    (dims: { width: number; height: number }) => {
      dispatch({ type: "SET_OVERLAY_NATIVE_DIMENSIONS", payload: dims });
    },
    [],
  );

  const canDownload = state.isPositioned;
  const canContinue = state.isDownloaded;
  const stepStatuses = getStepStatuses(state.currentStep);

  return {
    state,
    uploadImage,
    updatePosition,
    updateScale,
    updateRotation,
    markPositioned,
    markDownloaded,
    toggleOverlay,
    setCanvasDataUrl,
    reset,
    resetWorkflow,
    setCanvasSize,
    setDpiOverride,
    setOverlayOpacity,
    setKeepAspectRatio,
    setAlgorithm,
    setImageDimensions,
    centerHorizontal,
    centerVertical,
    fitWidth,
    fitHeight,
    setVerticalPreset,
    setOverlayNativeDimensions,
    canDownload,
    canContinue,
    stepStatuses,
  };
}
