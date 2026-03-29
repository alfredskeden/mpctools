"use client";

import { useCallback, useReducer, useRef } from "react";
import { removeWatermark, removeWatermarkFromPixels } from "@/lib/watermark-api";
import { track } from "@/lib/analytics";
import type { WatermarkMetadata, PixelData } from "@/lib/watermark-api";

type IdleState = { phase: "idle" };
type ProcessingState = { phase: "processing" };
type ResultState = {
  phase: "result";
  blob: Blob;
  previewUrl: string;
  metadata: WatermarkMetadata;
};
type ErrorState = { phase: "error"; message: string };

export type DewatermarkState =
  | IdleState
  | ProcessingState
  | ResultState
  | ErrorState;

type Action =
  | { type: "START_PROCESSING" }
  | { type: "SET_RESULT"; blob: Blob; previewUrl: string; metadata: WatermarkMetadata }
  | { type: "SET_ERROR"; message: string }
  | { type: "RESET" };

function reducer(state: DewatermarkState, action: Action): DewatermarkState {
  switch (action.type) {
    case "START_PROCESSING":
      return { phase: "processing" };
    case "SET_RESULT":
      return {
        phase: "result",
        blob: action.blob,
        previewUrl: action.previewUrl,
        metadata: action.metadata,
      };
    case "SET_ERROR":
      return { phase: "error", message: action.message };
    case "RESET":
      return { phase: "idle" };
    /* v8 ignore next 2 */
    default:
      return state;
  }
}

const initialState: DewatermarkState = { phase: "idle" };

export function useDewatermarkDialog() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const pixelDataRef = useRef<PixelData | null>(null);

  const processFile = useCallback((file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "START_PROCESSING" });
    track("dewatermark_started", { fileName: file.name });

    removeWatermark(file, controller.signal)
      .then((result) => {
        const url = URL.createObjectURL(result.blob);
        previewUrlRef.current = url;
        pixelDataRef.current = result.pixelData;

        dispatch({
          type: "SET_RESULT",
          blob: result.blob,
          previewUrl: url,
          metadata: result.metadata,
        });
        track("dewatermark_succeeded", {
          corner: result.metadata.corner,
          confidence: result.metadata.confidence,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          dispatch({ type: "RESET" });
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        dispatch({ type: "SET_ERROR", message });
        track("dewatermark_failed", { error: message });
      });
  }, []);

  const runAdaptiveDetection = useCallback(() => {
    if (!pixelDataRef.current) return;

    const { pixels, width, height } = pixelDataRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "START_PROCESSING" });
    track("dewatermark_adaptive_started");

    removeWatermarkFromPixels(pixels, width, height, { adaptive: true })
      .then((result) => {
        URL.revokeObjectURL(previewUrlRef.current!);
        const url = URL.createObjectURL(result.blob);
        previewUrlRef.current = url;
        pixelDataRef.current = result.pixelData;

        dispatch({
          type: "SET_RESULT",
          blob: result.blob,
          previewUrl: url,
          metadata: result.metadata,
        });
        track("dewatermark_adaptive_succeeded", {
          corner: result.metadata.corner,
          confidence: result.metadata.confidence,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          dispatch({ type: "RESET" });
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        dispatch({ type: "SET_ERROR", message });
        track("dewatermark_adaptive_failed", { error: message });
      });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    pixelDataRef.current = null;

    dispatch({ type: "RESET" });
  }, []);

  const acceptResult = useCallback(async (): Promise<{
    image: HTMLImageElement;
    fileName: string;
    fileSize: number;
  }> => {
    if (state.phase !== "result") {
      throw new Error("No result to accept");
    }

    const { blob, previewUrl } = state;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          image: img,
          fileName: `dewatermarked_${Date.now()}.png`,
          fileSize: blob.size,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = previewUrl;
    });
  }, [state]);

  return { state, processFile, reset, acceptResult, runAdaptiveDetection };
}
