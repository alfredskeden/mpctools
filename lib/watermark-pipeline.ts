import sharp from "sharp";
import { detectBestCandidate } from "@/lib/watermark-detection";
import { runPipeline } from "@/lib/watermark-removal";
import type { RemovalSettings } from "@/lib/watermark-removal";
import type { WatermarkCorner, WatermarkVariant } from "@/lib/watermark-detection";
import type { RawImageData } from "@/lib/watermark-math";

export type PipelineOptions = {
  adaptive?: boolean;
  corner?: WatermarkCorner | "auto";
  forcedVariant?: WatermarkVariant;
  alphaGain?: number;
  feather?: number;
  postLightness?: number;
  edgeReveal?: number;
  innerPunch?: number;
  maskExpand?: number;
};

export type PipelineOutput = {
  pngBytes: Uint8Array;
  corner: string;
  confidence: number;
  alphaGain: number;
  source: "adaptive" | "preset";
  accepted: boolean;
};

export async function runWatermarkPipeline(
  imageBuffer: Buffer,
  options: PipelineOptions = {},
): Promise<PipelineOutput> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const img: RawImageData = {
    data: new Uint8ClampedArray(data),
    width: info.width,
    height: info.height,
  };

  const detection =
    options.adaptive
      ? detectBestCandidate(img, {
          forcedVariant: options.forcedVariant ?? undefined,
          corner: options.corner ?? "auto",
        })
      : null;

  const settings: RemovalSettings = {
    feather: options.feather ?? 4,
    postLightness: options.postLightness ?? 2.75,
    maskExpand: options.maskExpand ?? 1.5,
  };

  if (options.corner) settings.corner = options.corner;
  if (options.alphaGain !== undefined) settings.alphaGain = options.alphaGain;
  if (options.edgeReveal !== undefined) settings.edgeReveal = options.edgeReveal;
  if (options.innerPunch !== undefined) settings.innerPunch = options.innerPunch;

  const result = runPipeline(img, settings, detection);

  const pngBuffer = await sharp(Buffer.from(result.imageData.data), {
    raw: { width: result.imageData.width, height: result.imageData.height, channels: 4 },
  })
    .png({ compressionLevel: 1 })
    .toBuffer();

  return {
    pngBytes: new Uint8Array(pngBuffer),
    corner: result.accepted ? String(detection?.corner ?? "") : "",
    confidence: result.confidence,
    alphaGain: result.alphaGain,
    source: result.detectionSource,
    accepted: result.accepted,
  };
}
