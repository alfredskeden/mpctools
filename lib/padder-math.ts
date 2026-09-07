import type { Dimensions } from "./canvas-utils";

export type MpcTier = Dimensions & {
  /** Print resolution this tier represents. */
  dpi: number;
};

/**
 * MPC print size (2.48in x 3.46in, bleed included) expressed at each common DPI.
 * All four share the ratio 816/1110, labelled "11:15" for prompt purposes.
 */
export const MPC_TIERS: readonly MpcTier[] = [
  { dpi: 300, width: 816, height: 1110 },
  { dpi: 600, width: 1632, height: 2220 },
  { dpi: 800, width: 2176, height: 2960 },
  { dpi: 1200, width: 3264, height: 4440 },
];

export type PadTargetId = "mpc-default" | "classic-borderless";

export type PadTarget = {
  id: PadTargetId;
  /** Human-readable name for the UI. */
  label: string;
  /** Declared label — never gcd-reduced from the pixel dimensions. */
  ratioLabel: string;
  /** Ratio numerator/denominator used to crop the tier height, when cropped. */
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
  tier: MpcTier;
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
 * Smallest tier that contains the image in both dimensions.
 * Returns null when the image exceeds every tier — never scales down.
 */
export function selectTier(image: Dimensions): MpcTier | null {
  return (
    MPC_TIERS.find(
      (tier) => tier.width >= image.width && tier.height >= image.height,
    ) ?? null
  );
}

/**
 * Derive the full pad layout for an image and target.
 * The image is centered in the tier at native size; the borderless target
 * then crops the canvas from the bottom only, leaving the image where it is.
 */
export function computePadLayout(
  image: Dimensions,
  target: PadTarget,
): PadLayout | null {
  const tier = selectTier(image);
  if (!tier) return null;

  const x = Math.floor((tier.width - image.width) / 2);
  const y = Math.floor((tier.height - image.height) / 2);

  const canvasHeight = target.crop
    ? Math.round((tier.width * target.crop.heightUnits) / target.crop.widthUnits)
    : tier.height;

  const overflow = y + image.height - canvasHeight;

  return {
    tier,
    target,
    canvas: { width: tier.width, height: canvasHeight },
    x,
    y,
    image: { width: image.width, height: image.height },
    croppedPixels: Math.max(0, overflow),
  };
}
