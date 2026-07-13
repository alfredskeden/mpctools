import {
  removeWatermarkReverseAlpha,
  cloneRawImageData,
  type RawImageData,
} from "@/lib/watermark-math";
import {
  getDefaultConfig,
  getAlphaMapForSize,
  getAnchorPosition,
  type WatermarkCorner,
  type DetectionResult,
} from "@/lib/watermark-detection";
import { getEmbeddedGeminiDivideMap } from "@/lib/watermark-alpha-maps";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RemovalSettings = {
  corner?: WatermarkCorner | "auto";
  alphaGain?: number;
};

export type PipelineResult = {
  imageData: RawImageData;
  position: { x: number; y: number; width: number; height: number };
  alphaMap: Float32Array;
  alphaGain: number;
  confidence: number;
  accepted: boolean;
  detectionSource: "adaptive" | "preset";
};

// The DIVIDE edge-cleanup map is authored for the 96px (1k+ tier) logo only.
const GEMINI_DIVIDE_MAP_SIZE = 96;

// ─── Exported functions ───────────────────────────────────────────────────────

export function runPipeline(
  img: RawImageData,
  settings: RemovalSettings,
  detection?: DetectionResult | null,
): PipelineResult {
  const alphaGain =
    Number.isFinite(settings.alphaGain) && settings.alphaGain! > 0
      ? settings.alphaGain!
      : 1;

  let position: { x: number; y: number; width: number; height: number };
  let alphaMap: Float32Array;
  let effectiveGain: number;
  let confidence: number;
  let accepted: boolean;
  let detectionSource: "adaptive" | "preset";

  if (detection?.accepted) {
    position = detection.position;
    alphaMap = detection.alphaMap;
    effectiveGain = detection.alphaGain;
    confidence = detection.confidence;
    accepted = true;
    detectionSource = "adaptive";
  } else {
    const corner: WatermarkCorner =
      settings.corner && settings.corner !== "auto"
        ? settings.corner
        : "bottom-right";
    const config = getDefaultConfig(img.width, img.height);
    position = getAnchorPosition(config, corner, img.width, img.height);
    const map = getAlphaMapForSize(position.width);
    /* v8 ignore start */
    alphaMap = map ?? new Float32Array(position.width * position.height);
    /* v8 ignore stop */
    effectiveGain = alphaGain;
    confidence = 0.74;
    accepted = false;
    detectionSource = "preset";
  }

  // Reproduce the PSD "Reverse Alpha watermark remover" group exactly: apply the
  // reverse-alpha unblend (SUBTRACT + COLOR DODGE) plus the DIVIDE edge cleanup as
  // a single flat pass over the anchored region. The alpha template fades to 0
  // outside the logo, so the correction leaves no seam and needs no feather mask.
  const repaired = cloneRawImageData(img);
  const divideMap =
    position.width === GEMINI_DIVIDE_MAP_SIZE
      ? getEmbeddedGeminiDivideMap(GEMINI_DIVIDE_MAP_SIZE)
      : null;
  removeWatermarkReverseAlpha(repaired, alphaMap, position, {
    alphaGain: effectiveGain,
    divideMap: divideMap ?? undefined,
  });

  return {
    imageData: repaired,
    position,
    alphaMap,
    alphaGain: effectiveGain,
    confidence,
    accepted,
    detectionSource,
  };
}
