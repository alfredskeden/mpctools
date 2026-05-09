import { removeWatermarkInWorker } from "./worker-client";
import type { RemovalSettings } from "./watermark-removal";

export type WatermarkMetadata = {
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
};

export type PixelData = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
};

export type WatermarkResult = {
  blob: Blob;
  metadata: WatermarkMetadata;
  pixelData: PixelData;
};

export type RemoveWatermarkApiOptions = {
  adaptive?: boolean;
  settings?: RemovalSettings;
  confidenceThreshold?: number;
};

export async function removeWatermark(
  file: File,
  signal?: AbortSignal,
  options?: RemoveWatermarkApiOptions,
): Promise<WatermarkResult> {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, width, height);

  const originalPixels = new Uint8ClampedArray(imageData.data);

  const result = await removeWatermarkInWorker(imageData.data, width, height, {
    adaptive: options?.adaptive,
    settings: options?.settings,
    confidenceThreshold: options?.confidenceThreshold,
  });

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const outCanvas = new OffscreenCanvas(result.width, result.height);
  const outCtx = outCanvas.getContext("2d")!;
  const outPixels = new Uint8ClampedArray(result.pixels);
  outCtx.putImageData(
    new ImageData(outPixels, result.width, result.height),
    0,
    0,
  );
  const blob = await outCanvas.convertToBlob({ type: "image/png" });

  return {
    blob,
    metadata: result.metadata,
    pixelData: { pixels: originalPixels, width, height },
  };
}

export async function removeWatermarkFromPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options?: RemoveWatermarkApiOptions,
): Promise<WatermarkResult> {
  const copy = new Uint8ClampedArray(pixels);

  const result = await removeWatermarkInWorker(copy, width, height, {
    adaptive: options?.adaptive,
    settings: options?.settings,
    confidenceThreshold: options?.confidenceThreshold,
  });

  const outCanvas = new OffscreenCanvas(result.width, result.height);
  const outCtx = outCanvas.getContext("2d")!;
  const outPixels = new Uint8ClampedArray(result.pixels);
  outCtx.putImageData(
    new ImageData(outPixels, result.width, result.height),
    0,
    0,
  );
  const blob = await outCanvas.convertToBlob({ type: "image/png" });

  return {
    blob,
    metadata: result.metadata,
    pixelData: { pixels, width, height },
  };
}
