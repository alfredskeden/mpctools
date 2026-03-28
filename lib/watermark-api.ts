import { removeWatermarkInWorker } from "./worker-client";

export type WatermarkMetadata = {
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
};

export type WatermarkResult = {
  blob: Blob;
  metadata: WatermarkMetadata;
};

export async function removeWatermark(
  file: File,
  signal?: AbortSignal,
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

  const result = await removeWatermarkInWorker(
    imageData.data,
    width,
    height,
  );

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

  return { blob, metadata: result.metadata };
}
