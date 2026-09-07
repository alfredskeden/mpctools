import { BG_COLOR } from "./canvas-utils";
import type { PadLayout } from "./padder-math";

export type PadImage = CanvasImageSource & { width: number; height: number };

/**
 * Render the pad scene: grey canvas, then the image once at native size at the
 * layout offset. Anything past the canvas edge is clipped by the canvas itself —
 * that is how the borderless bottom crop happens.
 */
export function renderPadScene(
  ctx: CanvasRenderingContext2D,
  image: PadImage,
  layout: PadLayout,
): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, layout.canvas.width, layout.canvas.height);
  ctx.drawImage(image, layout.x, layout.y, layout.image.width, layout.image.height);
}

/**
 * Render into an offscreen canvas at the layout's true pixel size.
 * Never derived from the on-screen preview.
 */
export function exportPaddedCanvas(
  image: PadImage,
  layout: PadLayout,
): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvas.width;
  canvas.height = layout.canvas.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  renderPadScene(ctx, image, layout);
  return canvas;
}

/** `padded_<original-name>.png`, falling back to `padded_card.png`. */
export function paddedFileName(originalName: string | null | undefined): string {
  const baseName = originalName?.replace(/\.[^.]+$/, "") || "card";
  return `padded_${baseName}.png`;
}
