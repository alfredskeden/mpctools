export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type DrawParams = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

/**
 * Calculate dimensions to fit an image within a container while preserving aspect ratio.
 * Returns the scaled width and height.
 */
export function calculateFitDimensions(
  image: Dimensions,
  container: Dimensions,
): Dimensions {
  const scaleX = container.width / image.width;
  const scaleY = container.height / image.height;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: Math.round(image.width * scale),
    height: Math.round(image.height * scale),
  };
}

/**
 * Calculate canvas draw parameters for an image at a given position and scale.
 * The image is drawn centered at the canvas center, offset by position.
 */
export function calculateDrawParams(
  image: Dimensions,
  canvas: Dimensions,
  position: Position,
  scale: number,
): DrawParams {
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  const dx = (canvas.width - scaledWidth) / 2 + position.x;
  const dy = (canvas.height - scaledHeight) / 2 + position.y;

  return {
    sx: 0,
    sy: 0,
    sw: image.width,
    sh: image.height,
    dx,
    dy,
    dw: scaledWidth,
    dh: scaledHeight,
  };
}

export const BG_COLOR = "#808080";

import { sharpenPixelData } from "./image-processing";
import { sharpenInWorker } from "./worker-client";
export { sharpenPixelData } from "./image-processing";

export function applyUnsharpMask(
  canvas: HTMLCanvasElement,
  amount: number,
  radius: number,
): void {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpened = sharpenPixelData(
    imageData.data,
    canvas.width,
    canvas.height,
    amount,
    radius,
  );
  const result = new ImageData(
    new Uint8ClampedArray(sharpened.buffer as ArrayBuffer),
    canvas.width,
    canvas.height,
  );
  ctx.putImageData(result, 0, 0);
}

export async function applyUnsharpMaskAsync(
  canvas: HTMLCanvasElement,
  amount: number,
  radius: number,
): Promise<void> {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpened = await sharpenInWorker(
    imageData.data,
    canvas.width,
    canvas.height,
    amount,
    radius,
  );
  const result = new ImageData(
    new Uint8ClampedArray(sharpened.buffer as ArrayBuffer),
    canvas.width,
    canvas.height,
  );
  ctx.putImageData(result, 0, 0);
}

export function detailPreservingResize(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  targetCanvas: HTMLCanvasElement,
): void {
  const ctx = targetCanvas.getContext("2d")!;
  const tw = targetCanvas.width;
  const th = targetCanvas.height;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, tw, th);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const isUpscale = tw > sw || th > sh;

  if (isUpscale) {
    ctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, tw, th);
    applyUnsharpMask(targetCanvas, 0.6, 1);
  } else {
    let currentSource: HTMLImageElement | HTMLCanvasElement = sourceImg;
    let curSx = sx;
    let curSy = sy;
    let curSw = sw;
    let curSh = sh;

    while (curSw / 2 > tw || curSh / 2 > th) {
      const halfW = Math.round(curSw / 2);
      const halfH = Math.round(curSh / 2);
      const stepCanvas = document.createElement("canvas");
      stepCanvas.width = halfW;
      stepCanvas.height = halfH;
      const stepCtx = stepCanvas.getContext("2d")!;
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = "high";
      stepCtx.drawImage(
        currentSource,
        curSx,
        curSy,
        curSw,
        curSh,
        0,
        0,
        halfW,
        halfH,
      );
      currentSource = stepCanvas;
      curSx = 0;
      curSy = 0;
      curSw = halfW;
      curSh = halfH;
    }

    ctx.drawImage(currentSource, curSx, curSy, curSw, curSh, 0, 0, tw, th);
    applyUnsharpMask(targetCanvas, 0.8, 1);
  }
}

export const CANVAS_WIDTH = 3520;
export const CANVAS_HEIGHT = 4800;

/**
 * Calculate initial scale to fit an image within a canvas with 80% padding.
 * Returns 1 if the image already fits.
 */
export function calculateInitialScale(
  image: Dimensions,
  canvas: Dimensions,
): number {
  const scaleX = (canvas.width * 0.8) / image.width;
  const scaleY = (canvas.height * 0.8) / image.height;
  const fitScale = Math.min(scaleX, scaleY);
  return fitScale >= 1 ? 1 : fitScale;
}

export const MIN_VISIBLE = 50;

/**
 * Clamp a position so the image stays at least partially visible on the canvas.
 * Both axes allow free movement as long as MIN_VISIBLE pixels remain on screen.
 */
export function clampPosition(
  position: Position,
  image: Dimensions,
  canvas: Dimensions,
  scale: number,
): Position {
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  const clampAxis = (
    pos: number,
    scaledImageSize: number,
    canvasSize: number,
  ) => {
    const minOffset = MIN_VISIBLE - (canvasSize + scaledImageSize) / 2;
    const maxOffset = (canvasSize + scaledImageSize) / 2 - MIN_VISIBLE;
    return Math.max(minOffset, Math.min(maxOffset, pos));
  };

  return {
    x: clampAxis(position.x, scaledWidth, canvas.width),
    y: clampAxis(position.y, scaledHeight, canvas.height),
  };
}
