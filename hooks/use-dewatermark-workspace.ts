"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { removeWatermarkFromPixels } from "@/lib/watermark-api";
import type { RemovalSettings } from "@/lib/watermark-removal";
import type {
  WatermarkMetadata,
  WatermarkResult,
} from "@/lib/watermark-api";
import type { WatermarkCorner } from "@/lib/watermark-detection";

export type DewatermarkCornerChoice = "auto" | "tl" | "tr" | "bl" | "br";

export type DewatermarkExportFormat = "png" | "jpeg" | "webp";

export type DewatermarkSettings = {
  adaptive: boolean;
  corner: DewatermarkCornerChoice;
  confidenceThreshold: number;
  alphaGain: number;
  exportFormat: DewatermarkExportFormat;
};

export const DEWATERMARK_DEFAULTS: DewatermarkSettings = {
  adaptive: false,
  corner: "auto",
  confidenceThreshold: 0.72,
  alphaGain: 1,
  exportFormat: "png",
};

export const DEWATERMARK_DEBOUNCE_MS = 250;

const CORNER_TO_REMOVAL: Record<
  DewatermarkCornerChoice,
  WatermarkCorner | "auto"
> = {
  auto: "auto",
  tl: "top-left",
  tr: "top-right",
  bl: "bottom-left",
  br: "bottom-right",
};

export type DewatermarkImageMeta = {
  name: string;
  size: number;
  width: number;
  height: number;
};

type State = {
  image: DewatermarkImageMeta | null;
  settings: DewatermarkSettings;
  committedSettings: DewatermarkSettings;
  detection: WatermarkMetadata | null;
  isProcessing: boolean;
  error: string | null;
  resultRevision: number;
};

type Action =
  | { type: "IMAGE_LOADED"; image: DewatermarkImageMeta }
  | { type: "IMAGE_CLEARED" }
  | { type: "PATCH_SETTINGS"; patch: Partial<DewatermarkSettings> }
  | { type: "RESET_SETTINGS" }
  | { type: "RUN_STARTED" }
  | {
      type: "RUN_SUCCEEDED";
      committed: DewatermarkSettings;
      metadata: WatermarkMetadata;
    }
  | { type: "COMMIT_NO_RENDER"; committed: DewatermarkSettings }
  | { type: "RUN_ABORTED" }
  | { type: "RUN_FAILED"; message: string };

const initialState: State = {
  image: null,
  settings: DEWATERMARK_DEFAULTS,
  committedSettings: DEWATERMARK_DEFAULTS,
  detection: null,
  isProcessing: false,
  error: null,
  resultRevision: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "IMAGE_LOADED":
      return { ...initialState, image: action.image, isProcessing: true };
    case "IMAGE_CLEARED":
      return initialState;
    case "PATCH_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "RESET_SETTINGS":
      return { ...state, settings: DEWATERMARK_DEFAULTS };
    case "RUN_STARTED":
      return { ...state, isProcessing: true, error: null };
    case "RUN_SUCCEEDED":
      return {
        ...state,
        committedSettings: action.committed,
        detection: action.metadata,
        isProcessing: false,
        error: null,
        resultRevision: state.resultRevision + 1,
      };
    case "COMMIT_NO_RENDER":
      return { ...state, committedSettings: action.committed };
    case "RUN_ABORTED":
      return { ...state, isProcessing: false };
    case "RUN_FAILED":
      return { ...state, isProcessing: false, error: action.message };
  }
}

function settingsEqual(a: DewatermarkSettings, b: DewatermarkSettings): boolean {
  return (
    a.adaptive === b.adaptive &&
    a.corner === b.corner &&
    a.confidenceThreshold === b.confidenceThreshold &&
    a.alphaGain === b.alphaGain &&
    a.exportFormat === b.exportFormat
  );
}

function affectsRender(
  next: DewatermarkSettings,
  prev: DewatermarkSettings,
): boolean {
  return (
    next.adaptive !== prev.adaptive ||
    next.corner !== prev.corner ||
    next.confidenceThreshold !== prev.confidenceThreshold ||
    next.alphaGain !== prev.alphaGain
  );
}

export function toRemovalSettings(s: DewatermarkSettings): RemovalSettings {
  return {
    corner: CORNER_TO_REMOVAL[s.corner],
    alphaGain: s.alphaGain,
  };
}

export type DewatermarkRunOptions = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  settings: DewatermarkSettings;
  signal: AbortSignal;
};

export type DewatermarkRunner = (
  opts: DewatermarkRunOptions,
) => Promise<WatermarkResult>;

/* v8 ignore start -- thin wrapper exercised in production; covered indirectly via watermark-api tests */
const defaultRunner: DewatermarkRunner = ({
  pixels,
  width,
  height,
  settings,
  signal,
}) => {
  if (signal.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  return removeWatermarkFromPixels(pixels, width, height, {
    adaptive: settings.adaptive,
    settings: toRemovalSettings(settings),
    confidenceThreshold: settings.confidenceThreshold,
  });
};
/* v8 ignore stop */

export type ImageDecoder = (
  file: File,
) => Promise<{ pixels: Uint8ClampedArray; width: number; height: number }>;

/* v8 ignore start -- exercised only in browser */
const defaultDecoder: ImageDecoder = async (file) => {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, width, height);
  return {
    pixels: new Uint8ClampedArray(imageData.data),
    width,
    height,
  };
};
/* v8 ignore stop */

export type UseDewatermarkWorkspaceOptions = {
  runner?: DewatermarkRunner;
  debounceMs?: number;
  decoder?: ImageDecoder;
};

export function useDewatermarkWorkspace(
  options: UseDewatermarkWorkspaceOptions = {},
) {
  const {
    runner = defaultRunner,
    debounceMs = DEWATERMARK_DEBOUNCE_MS,
    decoder = defaultDecoder,
  } = options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const originalPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const resultBlobRef = useRef<Blob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const runPipeline = useCallback(
    (settings: DewatermarkSettings) => {
      const pixels = originalPixelsRef.current;
      const dims = dimensionsRef.current;
      /* v8 ignore start -- defensive: only called once pixels and dims are set */
      if (!pixels || !dims) return;
      /* v8 ignore stop */

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const myRunId = ++runIdRef.current;

      dispatch({ type: "RUN_STARTED" });

      runner({
        pixels,
        width: dims.width,
        height: dims.height,
        settings,
        signal: controller.signal,
      })
        .then((result) => {
          if (myRunId !== runIdRef.current) return;
          resultBlobRef.current = result.blob;
          dispatch({
            type: "RUN_SUCCEEDED",
            committed: settings,
            metadata: result.metadata,
          });
        })
        .catch((error: unknown) => {
          if (myRunId !== runIdRef.current) return;
          if (error instanceof DOMException && error.name === "AbortError") {
            dispatch({ type: "RUN_ABORTED" });
            return;
          }
          const message =
            error instanceof Error ? error.message : "Unknown error";
          dispatch({ type: "RUN_FAILED", message });
        });
    },
    [runner],
  );

  useEffect(() => {
    if (!state.image) return;
    if (settingsEqual(state.settings, state.committedSettings)) return;
    if (!affectsRender(state.settings, state.committedSettings)) {
      dispatch({ type: "COMMIT_NO_RENDER", committed: state.settings });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const snapshot = state.settings;
    debounceRef.current = setTimeout(() => {
      runPipeline(snapshot);
    }, debounceMs);
    /* v8 ignore start -- effect cleanup runs only between renders; tests cover the same path via clear() and acceptFile() */
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    /* v8 ignore stop */
  }, [
    state.image,
    state.settings,
    state.committedSettings,
    runPipeline,
    debounceMs,
  ]);

  const acceptFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const decoded = await decoder(file);
      originalPixelsRef.current = decoded.pixels;
      dimensionsRef.current = { width: decoded.width, height: decoded.height };
      resultBlobRef.current = null;

      dispatch({
        type: "IMAGE_LOADED",
        image: {
          name: file.name,
          size: file.size,
          width: decoded.width,
          height: decoded.height,
        },
      });

      runPipeline(DEWATERMARK_DEFAULTS);
    },
    [decoder, runPipeline],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    originalPixelsRef.current = null;
    dimensionsRef.current = null;
    resultBlobRef.current = null;
    dispatch({ type: "IMAGE_CLEARED" });
  }, []);

  const patch = useCallback((p: Partial<DewatermarkSettings>) => {
    dispatch({ type: "PATCH_SETTINGS", patch: p });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET_SETTINGS" });
  }, []);

  const getResultBlob = useCallback(() => resultBlobRef.current, []);
  const getOriginalPixels = useCallback(() => originalPixelsRef.current, []);
  const getDimensions = useCallback(() => dimensionsRef.current, []);

  const isDirty = !settingsEqual(state.settings, DEWATERMARK_DEFAULTS);

  return {
    image: state.image,
    settings: state.settings,
    committedSettings: state.committedSettings,
    detection: state.detection,
    isProcessing: state.isProcessing,
    error: state.error,
    isDirty,
    resultRevision: state.resultRevision,
    patch,
    reset,
    acceptFile,
    clear,
    getResultBlob,
    getOriginalPixels,
    getDimensions,
  };
}
