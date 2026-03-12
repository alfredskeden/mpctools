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

  const clampAxis = (pos: number, scaledImageSize: number, canvasSize: number) => {
    const minOffset = MIN_VISIBLE - (canvasSize + scaledImageSize) / 2;
    const maxOffset = (canvasSize + scaledImageSize) / 2 - MIN_VISIBLE;
    return Math.max(minOffset, Math.min(maxOffset, pos));
  };

  return {
    x: clampAxis(position.x, scaledWidth, canvas.width),
    y: clampAxis(position.y, scaledHeight, canvas.height),
  };
}
