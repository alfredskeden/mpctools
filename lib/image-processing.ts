import type { GuideAnalysis } from "./merger-utils";

/**
 * Pure pixel-data sharpening via unsharp mask.
 * Operates on raw RGBA pixel arrays — no DOM dependency.
 */
export function sharpenPixelData(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius: number,
): Uint8ClampedArray {
  const length = pixels.length;
  const result = new Uint8ClampedArray(length);

  // Box blur
  const blurred = new Uint8ClampedArray(length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += pixels[idx];
            g += pixels[idx + 1];
            b += pixels[idx + 2];
            count++;
          }
        }
      }
      const idx = (y * width + x) * 4;
      blurred[idx] = r / count;
      blurred[idx + 1] = g / count;
      blurred[idx + 2] = b / count;
      blurred[idx + 3] = pixels[idx + 3];
    }
  }

  // Unsharp mask: result = original + amount * (original - blurred)
  for (let i = 0; i < length; i += 4) {
    result[i] = Math.min(
      255,
      Math.max(0, pixels[i] + amount * (pixels[i] - blurred[i])),
    );
    result[i + 1] = Math.min(
      255,
      Math.max(0, pixels[i + 1] + amount * (pixels[i + 1] - blurred[i + 1])),
    );
    result[i + 2] = Math.min(
      255,
      Math.max(0, pixels[i + 2] + amount * (pixels[i + 2] - blurred[i + 2])),
    );
    result[i + 3] = pixels[i + 3];
  }

  return result;
}

/**
 * Analyze guide image pixel data to find non-gray bounding box.
 * Pure function — takes raw pixel array instead of canvas.
 */
export function analyzeGuideData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  ogWidth: number,
  ogHeight: number,
): GuideAnalysis | null {
  const threshold = 12;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (
        Math.abs(r - 128) > threshold ||
        Math.abs(g - 128) > threshold ||
        Math.abs(b - 128) > threshold
      ) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  const newCanvasW = Math.round(ogWidth * (width / bboxW));
  const newCanvasH = Math.round(ogHeight * (height / bboxH));

  const newX = Math.round((minX / width) * newCanvasW);
  const newY = Math.round((minY / height) * newCanvasH);

  return { canvasW: newCanvasW, canvasH: newCanvasH, ogX: newX, ogY: newY };
}
