"use client";

import { useCallback, useReducer, useRef } from "react";
import { removeMergerWatermark } from "@/app/(steps)/merger/actions";
import { track } from "@/lib/analytics";
import type { WatermarkActionResult } from "@/app/(steps)/merger/actions";

type WatermarkMetadata = {
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
};

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

function buildMetadata(result: WatermarkActionResult): WatermarkMetadata {
  return {
    corner: result.corner,
    confidence: result.confidence,
    alphaGain: result.alphaGain,
    source: result.source,
  };
}

export function useDewatermarkDialog() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const previewUrlRef = useRef<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const processFile = useCallback((file: File) => {
    fileRef.current = file;

    dispatch({ type: "START_PROCESSING" });
    track("dewatermark_started", { fileName: file.name });

    removeMergerWatermark(file, { adaptive: false })
      .then((result) => {
        const blob = new Blob([new Uint8Array(result.pngBytes)], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;

        dispatch({
          type: "SET_RESULT",
          blob,
          previewUrl: url,
          metadata: buildMetadata(result),
        });
        track("dewatermark_succeeded", {
          corner: result.corner,
          confidence: result.confidence,
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        dispatch({ type: "SET_ERROR", message });
        track("dewatermark_failed", { error: message });
      });
  }, []);

  const runAdaptiveDetection = useCallback(() => {
    if (!fileRef.current) return;

    const file = fileRef.current;

    dispatch({ type: "START_PROCESSING" });
    track("dewatermark_adaptive_started");

    removeMergerWatermark(file, { adaptive: true })
      .then((result) => {
        URL.revokeObjectURL(previewUrlRef.current!);
        const blob = new Blob([new Uint8Array(result.pngBytes)], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;

        dispatch({
          type: "SET_RESULT",
          blob,
          previewUrl: url,
          metadata: buildMetadata(result),
        });
        track("dewatermark_adaptive_succeeded", {
          corner: result.corner,
          confidence: result.confidence,
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        dispatch({ type: "SET_ERROR", message });
        track("dewatermark_adaptive_failed", { error: message });
      });
  }, []);

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    fileRef.current = null;

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
