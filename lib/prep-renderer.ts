import { CANVAS_WIDTH, CANVAS_HEIGHT, BG_COLOR } from "./canvas-utils";

export type PrepSceneParams = {
  image: CanvasImageSource & { width: number; height: number };
  position: { x: number; y: number };
  scale: number;
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

  // Draw image with transforms
  ctx.save();
  ctx.translate(
    params.position.x + (params.image.width * params.scale) / 2,
    params.position.y + (params.image.height * params.scale) / 2,
  );
  ctx.rotate((params.rotation * Math.PI) / 180);
  ctx.scale(params.scale, params.scale);
  ctx.drawImage(
    params.image,
    -params.image.width / 2,
    -params.image.height / 2,
  );
  ctx.restore();
}
