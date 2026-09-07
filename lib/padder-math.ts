import type { Dimensions } from "./canvas-utils";

/**
 * The MPC bleed is a ratio, not a fixed pixel count. These two are the same
 * card at 300 DPI — trimmed, and with the print bleed MPC needs — and every
 * canvas is derived from them, so a scan at any resolution gets proportionally
 * the same grey border instead of being padded up to a fixed size.
 */
export const CARD_REFERENCE: Dimensions = { width: 745, height: 1040 };
export const BLEED_REFERENCE: Dimensions = { width: 816, height: 1110 };

export type PadTargetId = "mpc-default" | "classic-borderless";

export type PadTarget = {
  id: PadTargetId;
  /** Human-readable name for the UI. */
  label: string;
  /** Declared label — never gcd-reduced from the pixel dimensions. */
  ratioLabel: string;
  /** Ratio numerator/denominator used to crop the canvas, when cropped. */
  crop?: { widthUnits: number; heightUnits: number };
};

export const PAD_TARGETS: readonly PadTarget[] = [
  { id: "mpc-default", label: "MPC default", ratioLabel: "11:15" },
  {
    id: "classic-borderless",
    label: "Classic borderless",
    ratioLabel: "29:36",
    crop: { widthUnits: 29, heightUnits: 36 },
  },
];

export type PadLayout = {
  target: PadTarget;
  canvas: Dimensions;
  /** Native-size image placement inside the canvas. */
  x: number;
  y: number;
  image: Dimensions;
  /** Image pixels falling below the canvas bottom edge. */
  croppedPixels: number;
};

/**
 * Grow the scan by the MPC bleed to get the canvas, then centre the scan in it
 * at native size. The scan is never scaled: its own resolution sets the scale,
 * and only the amount of grey changes.
 *
 * Returns null for input that is not a portrait card scan.
 */
export function computePadLayout(
  image: Dimensions,
  target: PadTarget,
): PadLayout | null {
  if (image.width <= 0 || image.height <= 0) return null;
  if (image.height <= image.width) return null;

  // Take whichever axis demands the wider canvas, so neither edge is clipped.
  const canvasWidth = Math.max(
    Math.round((image.width * BLEED_REFERENCE.width) / CARD_REFERENCE.width),
    Math.round((image.height * BLEED_REFERENCE.width) / CARD_REFERENCE.height),
    image.width,
  );
  const fullHeight = Math.round(
    (canvasWidth * BLEED_REFERENCE.height) / BLEED_REFERENCE.width,
  );

  const x = Math.floor((canvasWidth - image.width) / 2);
  const y = Math.floor((fullHeight - image.height) / 2);

  // The borderless target crops the same canvas from the bottom only, so the
  // image keeps the position it had in the full canvas.
  const canvasHeight = target.crop
    ? Math.round((canvasWidth * target.crop.heightUnits) / target.crop.widthUnits)
    : fullHeight;

  return {
    target,
    canvas: { width: canvasWidth, height: canvasHeight },
    x,
    y,
    image: { width: image.width, height: image.height },
    croppedPixels: Math.max(0, y + image.height - canvasHeight),
  };
}
