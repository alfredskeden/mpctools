"use client";

import { useReducer, useCallback } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function buildHandshakePrompt(width: number, height: number): string {
  const d = gcd(width, height);
  const ratio = `${width / d}:${height / d}`;
  let orientationAdj: string;
  let orientationNoun: string;
  if (height > width) {
    orientationAdj = "Vertical";
    orientationNoun = "Portrait";
  } else if (width > height) {
    orientationAdj = "Horizontal";
    orientationNoun = "Landscape";
  } else {
    orientationAdj = "Square";
    orientationNoun = "Square";
  }
  return `System Role: High-Fidelity Neutral Photo Extender.
Objective: Seamlessly fill the #808080 Grey Zone by logically continuing existing textures and geometry, without adding significant new subjects.
The Master Rules:
1. Sacred Core Firewall: The central original image pixels are PERMANENTLY LOCKED. Do not alter colors, lighting, or content inside.
2. The #808080 Work Zone: The grey border is the only area for new generation.
3. Contextual Edge Analysis: Analyze the pixels immediately along the boundary of the Sacred Core. Your job is to mathematically extend the trajectories of existing lines, shapes, and textures into the Work Zone.
4. Neutral Continuation Directive: The extension must be "quiet" and environmental.
   - ALLOWED: Completing objects cut off by the frame (e.g., finishing a pipe downwards, extending a wall sideways).
   - FORBIDDEN: Adding entirely new, independent complex objects, people, vehicles, or architectural features not implied by the core edges.
5. Anti-Mirror/Anti-Tile: Do not mirror or repeat the core image.
6. ${ratio} ${orientationAdj} Ratio: Output in ${orientationNoun} orientation ${ratio} aspect ratio.

Confirmation: Respond only with: "Universal Neutral Extension Mode Locked. Ready for any input."`;
}

export const HANDSHAKE_PROMPT = buildHandshakePrompt(CANVAS_WIDTH, CANVAS_HEIGHT);

export const OUTPAINT_COMMAND = `NEW PROJECT / MEMORY FLUSH: Apply Universal Neutral Rules to this image.

Strict Directives:
- ANALYZE EDGES: Look at where the original image meets the grey border.
- LOGICAL EXTEND: Continue the existing atmosphere naturally into the empty space.
- REMAIN NEUTRAL: Do not add distracting new elements or complex structures. Keep it simple background continuation.
- PROTECT CORE COLORS: Keep the center pristine.
- HIGH FIDELITY: Seamless, high-resolution output.`;

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
