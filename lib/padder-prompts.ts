import { MPC_TIERS, PAD_TARGETS } from "./padder-math";

/** sessionStorage key handing the padded target from `/padder` to `/padder-outpaint`. */
export const PADDER_TARGET_KEY = "padder-target";

export type PadderTarget = {
  width: number;
  height: number;
  /** Declared label, never gcd-reduced from the dimensions. */
  ratioLabel: string;
};

/** 300 DPI MPC default — used when session storage holds nothing usable. */
export const DEFAULT_PADDER_TARGET: PadderTarget = {
  width: MPC_TIERS[0].width,
  height: MPC_TIERS[0].height,
  ratioLabel: PAD_TARGETS[0].ratioLabel,
};

// TODO: placeholder wording — the final handshake prompt is still owed by the
// person who asked for this feature. The size and ratio substitution is real.
export function buildPadderHandshakePrompt(target: PadderTarget): string {
  return `System Role: High-Fidelity Neutral Photo Extender.
Objective: Seamlessly fill the #808080 Grey Zone surrounding the card scan by logically continuing existing textures and geometry.
The Master Rules:
1. Sacred Core Firewall: The card scan pixels are PERMANENTLY LOCKED. Do not alter colors, lighting, or content inside.
2. The #808080 Work Zone: The grey border is the only area for new generation.
3. Contextual Edge Analysis: Extend the trajectories of existing lines, shapes and textures into the Work Zone.
4. Anti-Mirror/Anti-Tile: Do not mirror or repeat the core image.
5. Output Size: ${target.width}x${target.height} pixels, ${target.ratioLabel} aspect ratio, portrait orientation.

Confirmation: Respond only with: "Universal Neutral Extension Mode Locked. Ready for any input."`;
}

export const PADDER_HANDSHAKE_PROMPT = buildPadderHandshakePrompt(
  DEFAULT_PADDER_TARGET,
);

// TODO: placeholder wording — final command copy is still owed.
export const PADDER_COMMAND = `NEW PROJECT / MEMORY FLUSH: Apply Universal Neutral Rules to this padded card scan.

Strict Directives:
- ANALYZE EDGES: Look at where the card scan meets the grey border.
- LOGICAL EXTEND: Continue the existing artwork naturally into the grey.
- PROTECT CORE: Keep the scan pristine — it is already at print resolution.
- HIGH FIDELITY: Seamless, high-resolution output.`;

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
