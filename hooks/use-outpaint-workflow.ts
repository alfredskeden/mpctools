"use client";

import { useReducer, useCallback } from "react";

export const HANDSHAKE_PROMPT =
  'You are a photo editor. Your task is extending a photo into a neutral background zone... Rules: Do NOT add any new objects. Do NOT change the existing image content... 5:7 Vertical Ratio Respond with "understood" and nothing else.';

export const OUTPAINT_COMMAND =
  "Outpaint this image. Extend the existing scene naturally into the grey zones... Match lighting, perspective, and art style seamlessly. The grey area is the target zone.";

export type OutpaintStep = 1 | 2;

export type OutpaintState = {
  currentStep: OutpaintStep;
  handshakeSent: boolean;
  handshakeCollapsed: boolean;
};

type OutpaintAction =
  | { type: "SEND_HANDSHAKE" }
  | { type: "TOGGLE_HANDSHAKE_COLLAPSE" }
  | { type: "RESET" };

const initialState: OutpaintState = {
  currentStep: 1,
  handshakeSent: false,
  handshakeCollapsed: false,
};

export function outpaintReducer(
  state: OutpaintState,
  action: OutpaintAction,
): OutpaintState {
  switch (action.type) {
    case "SEND_HANDSHAKE":
      return {
        ...state,
        currentStep: 2,
        handshakeSent: true,
        handshakeCollapsed: true,
      };
    case "TOGGLE_HANDSHAKE_COLLAPSE":
      return {
        ...state,
        handshakeCollapsed: !state.handshakeCollapsed,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useOutpaintWorkflow() {
  const [state, dispatch] = useReducer(outpaintReducer, initialState);

  const sendHandshake = useCallback(() => {
    dispatch({ type: "SEND_HANDSHAKE" });
  }, []);

  const toggleHandshakeCollapse = useCallback(() => {
    dispatch({ type: "TOGGLE_HANDSHAKE_COLLAPSE" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const canContinueToMerge = state.handshakeSent;

  return {
    state,
    sendHandshake,
    toggleHandshakeCollapse,
    reset,
    canContinueToMerge,
  };
}
