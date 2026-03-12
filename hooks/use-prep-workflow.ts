"use client";

import { useReducer, useCallback } from "react";

export const OVERLAY_OPTIONS = [
  { id: "normal", label: "Normal", filename: "normal.png" },
  { id: "medium", label: "Medium", filename: "medium.png" },
  { id: "short", label: "Short", filename: "short.png" },
  { id: "tall_normal", label: "Tall Normal", filename: "tall_normal_mtg_box_size.png" },
  { id: "black_bottom", label: "Black Bottom", filename: "black_bottom_border.png" },
] as const;

export type PrepStep = 1 | 2 | 3;

export type StepStatus = "active" | "completed" | "upcoming";

export type PrepState = {
  currentStep: PrepStep;
  uploadedImage: string | null;
  imageElement: HTMLImageElement | null;
  position: { x: number; y: number };
  scale: number;
  isPositioned: boolean;
  canvasDataUrl: string | null;
  selectedOverlay: string | null;
};

type PrepAction =
  | { type: "UPLOAD_IMAGE"; payload: { dataUrl: string; element: HTMLImageElement } }
  | { type: "UPDATE_POSITION"; payload: { x: number; y: number } }
  | { type: "UPDATE_SCALE"; payload: number }
  | { type: "MARK_POSITIONED" }
  | { type: "SET_CANVAS_DATA_URL"; payload: string }
  | { type: "SELECT_OVERLAY"; payload: string | null }
  | { type: "RESET" };

const initialState: PrepState = {
  currentStep: 1,
  uploadedImage: null,
  imageElement: null,
  position: { x: 0, y: 0 },
  scale: 1,
  isPositioned: false,
  canvasDataUrl: null,
  selectedOverlay: null,
};

export function prepReducer(state: PrepState, action: PrepAction): PrepState {
  switch (action.type) {
    case "UPLOAD_IMAGE":
      return {
        ...state,
        currentStep: 2,
        uploadedImage: action.payload.dataUrl,
        imageElement: action.payload.element,
        position: { x: 0, y: 0 },
        scale: 1,
        isPositioned: false,
        canvasDataUrl: null,
        selectedOverlay: null,
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
    case "MARK_POSITIONED":
      return {
        ...state,
        currentStep: 3,
        isPositioned: true,
      };
    case "SET_CANVAS_DATA_URL":
      return {
        ...state,
        canvasDataUrl: action.payload,
      };
    case "SELECT_OVERLAY":
      return {
        ...state,
        selectedOverlay: action.payload,
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
    (dataUrl: string, element: HTMLImageElement) => {
      dispatch({ type: "UPLOAD_IMAGE", payload: { dataUrl, element } });
    },
    [],
  );

  const updatePosition = useCallback((x: number, y: number) => {
    dispatch({ type: "UPDATE_POSITION", payload: { x, y } });
  }, []);

  const updateScale = useCallback((scale: number) => {
    dispatch({ type: "UPDATE_SCALE", payload: scale });
  }, []);

  const markPositioned = useCallback(() => {
    dispatch({ type: "MARK_POSITIONED" });
  }, []);

  const setCanvasDataUrl = useCallback((dataUrl: string) => {
    dispatch({ type: "SET_CANVAS_DATA_URL", payload: dataUrl });
  }, []);

  const selectOverlay = useCallback((overlay: string | null) => {
    dispatch({ type: "SELECT_OVERLAY", payload: overlay });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const canDownload = state.isPositioned && state.canvasDataUrl !== null;
  const canContinue = canDownload;
  const stepStatuses = getStepStatuses(state.currentStep);

  return {
    state,
    uploadImage,
    updatePosition,
    updateScale,
    markPositioned,
    setCanvasDataUrl,
    selectOverlay,
    reset,
    canDownload,
    canContinue,
    stepStatuses,
  };
}
