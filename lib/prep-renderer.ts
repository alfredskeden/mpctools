import { CANVAS_WIDTH, CANVAS_HEIGHT, BG_COLOR } from "./canvas-utils";

export type PrepSceneParams = {
  image: CanvasImageSource & { width: number; height: number };
  position: { x: number; y: number };
  imageScale: number;
  renderScale: number;
  rotation: number;
  canvasWidth?: number;
  canvasHeight?: number;
};

/**
 * Render the prep scene onto a 2D canvas context.
 * Draws: gray background, then the image with translate/scale/rotate transforms.
 */
export function renderPrepScene(
  ctx: CanvasRenderingContext2D,
  params: PrepSceneParams,
): void {
  const w = params.canvasWidth ?? CANVAS_WIDTH;
  const h = params.canvasHeight ?? CANVAS_HEIGHT;

  // Gray background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Draw image with transforms (top-left bounding box + center-pivot rotation)
  ctx.save();
  const rs = params.renderScale;
  const is = params.imageScale;
  const scaledW = params.image.width * is;
  const scaledH = params.image.height * is;
  const centerX = (params.position.x + scaledW / 2) * rs;
  const centerY = (params.position.y + scaledH / 2) * rs;

  ctx.translate(centerX, centerY);
  ctx.rotate((params.rotation * Math.PI) / 180);
  ctx.drawImage(
    params.image,
    (-scaledW * rs) / 2,
    (-scaledH * rs) / 2,
    scaledW * rs,
    scaledH * rs,
  );
  ctx.restore();
}

/**
 * Render at full resolution (3520×4800) and return as a data URL.
 */
export function exportFullResolution(
  image: CanvasImageSource & { width: number; height: number },
  position: { x: number; y: number },
  imageScale: number,
  rotation: number,
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  renderPrepScene(ctx, {
    image,
    position,
    imageScale,
    renderScale: 1,
    rotation,
    canvasWidth,
    canvasHeight,
  });

  return canvas.toDataURL("image/png");
}
