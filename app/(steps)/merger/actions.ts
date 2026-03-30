"use server";

import { runWatermarkPipeline } from "@/lib/watermark-pipeline";

export type WatermarkActionResult = {
  pngBytes: Uint8Array;
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
  accepted: boolean;
};

export async function removeMergerWatermark(
  file: File,
  options: { adaptive?: boolean } = {},
): Promise<WatermarkActionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);
  const output = await runWatermarkPipeline(imageBuffer, { adaptive: options.adaptive ?? false });
  return {
    pngBytes: output.pngBytes,
    corner: output.corner,
    confidence: output.confidence,
    alphaGain: output.alphaGain,
    source: output.source,
    accepted: output.accepted,
  };
}
