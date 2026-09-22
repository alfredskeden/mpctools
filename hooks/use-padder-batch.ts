"use client";

import { useReducer, useCallback, useRef, useMemo } from "react";
import { padBatchFiles } from "@/lib/padder-batch";
import { buildZipBlob, downloadZipBlob } from "@/lib/zip-download";
import { track } from "@/lib/analytics";
import type { PadTarget } from "@/lib/padder-math";
import type { BatchFailureReason, BatchResult } from "@/lib/padder-batch";
import type { ZipEntry } from "@/lib/zip-download";

export const BATCH_ZIP_NAME = "padded-scans.zip";

export type BatchRowStatus = "pending" | "success" | "failed";

export type BatchRow = {
  name: string;
  size: number;
  type: string;
  status: BatchRowStatus;
  reason?: BatchFailureReason;
  canvasWidth?: number;
  canvasHeight?: number;
  cropPixels?: number;
};

type BatchPhase = "idle" | "running" | "done";

type BatchState = {
  rows: BatchRow[];
  phase: BatchPhase;
  processed: number;
  current: string;
};

type RowPatch = Partial<BatchRow> & { status: BatchRowStatus };

type BatchAction =
  | { type: "ADD_FILES"; payload: BatchRow[] }
  | { type: "START" }
  | { type: "PROGRESS"; payload: { processed: number; current: string } }
  | { type: "RESULT"; payload: { index: number; patch: RowPatch } }
  | { type: "DONE" }
  | { type: "RESET" };

const initialState: BatchState = {
  rows: [],
  phase: "idle",
  processed: 0,
  current: "",
};

export function padderBatchReducer(
  state: BatchState,
  action: BatchAction,
): BatchState {
  switch (action.type) {
    case "ADD_FILES":
      return { ...state, rows: [...state.rows, ...action.payload], phase: "idle" };
    case "START":
      return {
        ...state,
        phase: "running",
        processed: 0,
        current: "",
        rows: state.rows.map((row) => ({
          name: row.name,
          size: row.size,
          type: row.type,
          status: "pending",
        })),
      };
    case "PROGRESS":
      return {
        ...state,
        processed: action.payload.processed,
        current: action.payload.current,
      };
    case "RESULT":
      return {
        ...state,
        rows: state.rows.map((row, index) =>
          index === action.payload.index
            ? { ...row, ...action.payload.patch }
            : row,
        ),
      };
    case "DONE":
      return { ...state, phase: "done" };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function patchFor(result: BatchResult): RowPatch {
  if (result.status === "success") {
    return {
      status: "success",
      canvasWidth: result.layout.canvas.width,
      canvasHeight: result.layout.canvas.height,
      cropPixels: result.layout.croppedPixels,
    };
  }
  return { status: "failed", reason: result.reason };
}

export function usePadderBatch(target: PadTarget) {
  const [state, dispatch] = useReducer(padderBatchReducer, initialState);
  const filesRef = useRef<File[]>([]);
  const entriesRef = useRef<ZipEntry[]>([]);
  const cancelledRef = useRef(false);

  const addFiles = useCallback((files: File[]) => {
    filesRef.current = [...filesRef.current, ...files];
    dispatch({
      type: "ADD_FILES",
      payload: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending" as const,
      })),
    });
  }, []);

  const run = useCallback(async () => {
    if (filesRef.current.length === 0) return;

    cancelledRef.current = false;
    dispatch({ type: "START" });
    track("padder_batch_started", { count: filesRef.current.length });

    const outcome = await padBatchFiles(filesRef.current, target, {
      isCancelled: () => cancelledRef.current,
      onResult: (result, index) => {
        dispatch({ type: "RESULT", payload: { index, patch: patchFor(result) } });
      },
      onProgress: ({ processed, current }) => {
        dispatch({ type: "PROGRESS", payload: { processed, current } });
      },
    });

    entriesRef.current = outcome.entries;
    dispatch({ type: "DONE" });
    track("padder_batch_completed", {
      succeeded: outcome.entries.length,
      failed: outcome.failures.length,
    });
  }, [target]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const reset = useCallback(() => {
    filesRef.current = [];
    entriesRef.current = [];
    cancelledRef.current = false;
    dispatch({ type: "RESET" });
  }, []);

  const download = useCallback(async () => {
    if (entriesRef.current.length === 0) return;
    const blob = await buildZipBlob(entriesRef.current);
    downloadZipBlob(blob, BATCH_ZIP_NAME);
    track("padder_batch_downloaded", { count: entriesRef.current.length });
  }, []);

  const counts = useMemo(() => {
    const succeeded = state.rows.filter((r) => r.status === "success").length;
    const failed = state.rows.filter((r) => r.status === "failed").length;
    return {
      total: state.rows.length,
      succeeded,
      failed,
      pending: state.rows.length - succeeded - failed,
    };
  }, [state.rows]);

  const isRunning = state.phase === "running";

  return {
    rows: state.rows,
    phase: state.phase,
    progress: { processed: state.processed, total: counts.total, current: state.current },
    counts,
    isRunning,
    addFiles,
    run,
    cancel,
    reset,
    download,
    hasFiles: counts.total > 0,
    canRun: counts.total > 0 && !isRunning,
    canDownload: counts.succeeded > 0 && !isRunning,
  };
}
