"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { computePadLayout, PAD_TARGETS } from "@/lib/padder-math";
import type { PadTargetId } from "@/lib/padder-math";
import { PADDER_TARGET_KEY } from "@/lib/padder-prompts";
import { track } from "@/lib/analytics";

export type PadderState = {
  imageElement: HTMLImageElement | null;
  fileName: string | null;
  targetId: PadTargetId;
  downloaded: boolean;
};

type PadderAction =
  | {
      type: "UPLOAD_IMAGE";
      payload: { element: HTMLImageElement; fileName: string };
    }
  | { type: "SELECT_TARGET"; payload: PadTargetId }
  | { type: "MARK_DOWNLOADED" };

export const initialState: PadderState = {
  imageElement: null,
  fileName: null,
  targetId: PAD_TARGETS[0].id,
  downloaded: false,
};

export function padderReducer(
  state: PadderState,
  action: PadderAction,
): PadderState {
  switch (action.type) {
    case "UPLOAD_IMAGE":
      return {
        ...state,
        imageElement: action.payload.element,
        fileName: action.payload.fileName,
        downloaded: false,
      };
    case "SELECT_TARGET":
      return { ...state, targetId: action.payload, downloaded: false };
    case "MARK_DOWNLOADED":
      return { ...state, downloaded: true };
    default:
      return state;
  }
}

export function usePadderWorkflow() {
  const [state, dispatch] = useReducer(padderReducer, initialState);

  const target = useMemo(
    () =>
      PAD_TARGETS.find((candidate) => candidate.id === state.targetId) ??
      PAD_TARGETS[0],
    [state.targetId],
  );

  const layout = useMemo(() => {
    if (!state.imageElement) return null;
    return computePadLayout(
      { width: state.imageElement.width, height: state.imageElement.height },
      target,
    );
  }, [state.imageElement, target]);

  // Hand the resulting canvas to /padder-scrub.
  useEffect(() => {
    if (!layout) return;
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({
        width: layout.canvas.width,
        height: layout.canvas.height,
        ratioLabel: layout.target.ratioLabel,
      }),
    );
  }, [layout]);

  const uploadImage = useCallback(
    (element: HTMLImageElement, fileName: string) => {
      dispatch({ type: "UPLOAD_IMAGE", payload: { element, fileName } });
      track("padder_image_uploaded", {
        fileName,
        width: element.width,
        height: element.height,
      });
    },
    [],
  );

  const selectTarget = useCallback((targetId: PadTargetId) => {
    dispatch({ type: "SELECT_TARGET", payload: targetId });
    track("padder_target_selected", { target: targetId });
  }, []);

  const markDownloaded = useCallback(() => {
    dispatch({ type: "MARK_DOWNLOADED" });
    track("padder_image_downloaded", { target: state.targetId });
  }, [state.targetId]);

  return {
    state,
    layout,
    target,
    uploadImage,
    selectTarget,
    markDownloaded,
    /** An image was uploaded but no MPC tier contains it. */
    hasError: state.imageElement !== null && layout === null,
    canDownload: layout !== null,
    canContinue: state.downloaded,
  };
}
