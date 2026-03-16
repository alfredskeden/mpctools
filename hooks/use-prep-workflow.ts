"use client";

import { useReducer, useCallback } from "react";
import {
  calculateInitialScale,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@/lib/canvas-utils";
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
  | { type: "RESET" };

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
};

export function prepReducer(state: PrepState, action: PrepAction): PrepState {
  switch (action.type) {
    case "UPLOAD_IMAGE":
      return {
        ...state,
        currentStep: 2,
        uploadedImage: action.payload.dataUrl,
        imageElement: action.payload.element,
        fileName: action.payload.fileName,
        position: { x: 0, y: 0 },
        scale: calculateInitialScale(action.payload.element, {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }),
        rotation: 0,
        isPositioned: false,
        isDownloaded: false,
        selectedOverlays: ["tall_normal", "black_bottom"],
      };
    case "UPDATE_POSITION":
      return {
        ...state,
        position: action.payload,
      };
    case "UPDATE_SCALE":
      return {
        ...state,
        scale: action.payload,
      };
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
    case "TOGGLE_OVERLAY":
      return {
        ...state,
        selectedOverlays: state.selectedOverlays.includes(action.payload)
          ? state.selectedOverlays.filter((id) => id !== action.payload)
          : [...state.selectedOverlays, action.payload],
      };
    case "SET_CANVAS_DATA_URL":
      return {
        ...state,
        canvasDataUrl: action.payload,
      };
    case "RESET":
      return initialState;
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

export function usePrepWorkflow() {
  const [state, dispatch] = useReducer(prepReducer, initialState);

  const uploadImage = useCallback(
    (dataUrl: string, element: HTMLImageElement, fileName: string) => {
      dispatch({
        type: "UPLOAD_IMAGE",
        payload: { dataUrl, element, fileName },
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
  }, []);

  const markDownloaded = useCallback(() => {
    dispatch({ type: "MARK_DOWNLOADED" });
  }, []);

  const toggleOverlay = useCallback((overlay: string) => {
    dispatch({ type: "TOGGLE_OVERLAY", payload: overlay });
  }, []);

  const setCanvasDataUrl = useCallback((dataUrl: string) => {
    dispatch({ type: "SET_CANVAS_DATA_URL", payload: dataUrl });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

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
    canDownload,
    canContinue,
    stepStatuses,
  };
}
