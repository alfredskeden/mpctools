import { BLEED_REFERENCE, PAD_TARGETS } from "./padder-math";

/** sessionStorage key handing the padded target from `/padder` to `/padder-scrub`. */
export const PADDER_TARGET_KEY = "padder-target";

export type PadderTarget = {
  width: number;
  height: number;
  /** Declared label, never gcd-reduced from the dimensions. */
  ratioLabel: string;
};

/** 300 DPI MPC default — used when session storage holds nothing usable. */
export const DEFAULT_PADDER_TARGET: PadderTarget = {
  width: BLEED_REFERENCE.width,
  height: BLEED_REFERENCE.height,
  ratioLabel: PAD_TARGETS[0].ratioLabel,
};

export function buildPadderHandshakePrompt(target: PadderTarget): string {
  return `System Role: Digital TCG Restorer & Atmospheric Extender.
Objective: Take flat card images and create full-bleed ${target.ratioLabel} art by filling borders with neutral, high-fidelity background extensions.

The Rules:
1. UI & Border Purge: Treat all text, frames, and solid-color borders (black, grey, etc.) as area to be replaced.
2. Neutral Atmospheric Extension: You must fill the border areas by seamlessly extending the existing background textures, colors, and lighting (e.g., more sky, fog, ground texture).
3. Negative Constraint (Crucial): Do NOT add any new subjects, objects, buildings, characters, or complex details in the extended areas. The extension must remain atmospheric and "quiet" so focus remains on the original art.
4. Sacred Core & Quality: The original central artwork must remain untouched. The new extension must match its exact fidelity and texture.
5. Aspect Ratio: The final result must be a vertical ${target.ratioLabel} rectangle, full-bleed.

Confirmation: Respond only with: "Neutral TCG Extender Locked. Ready for atmospheric expansion."`;
}

export const PADDER_HANDSHAKE_PROMPT = buildPadderHandshakePrompt(
  DEFAULT_PADDER_TARGET,
);

/** Sent together with the padded image. */
export function buildPadderCommand(target: PadderTarget): string {
  return `NEW PROJECT: Execute Neutral Extension.

Directives:
- REMOVE UI: Erase all interior card text and frames.
- EXTEND NEUTRALLY: Replace solid borders by continuing the background atmosphere outwards (sky/ground textures only).
- NO NEW OBJECTS: Do not invent new complex details in the bleed area. Keep it clean.
- RATIO: Force a ${target.ratioLabel} Portrait aspect ratio.
- PRESERVE CORE: Keep the original art's identity and style 100% intact.`;
}

export const PADDER_COMMAND = buildPadderCommand(DEFAULT_PADDER_TARGET);

/** A shorter alternative to the command, offered alongside it. */
export const PADDER_ALTERNATE_COMMAND = `Remove the frame, text, and symbols plus extend the image seamlessly through the grey border to the edge of the image. Change nothing of the original composition`;

/**
 * Read the target written by `/padder`, falling back to the 300 DPI default
 * when absent, unparsable, or missing dimensions.
 */
export function readStoredPadderTarget(): PadderTarget {
  try {
    const stored = sessionStorage.getItem(PADDER_TARGET_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PadderTarget>;
      if (
        typeof parsed.width === "number" &&
        typeof parsed.height === "number" &&
        typeof parsed.ratioLabel === "string"
      ) {
        return {
          width: parsed.width,
          height: parsed.height,
          ratioLabel: parsed.ratioLabel,
        };
      }
    }
  } catch {
    // ignore — fall through to the default
  }
  return DEFAULT_PADDER_TARGET;
}
