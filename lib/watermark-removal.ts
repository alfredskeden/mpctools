import {
  GEMINI_CORRECTION_THRESHOLD,
  GEMINI_CORRECTION_GAMMA,
  GEMINI_VISIBILITY_EXPAND,
  GEMINI_VISIBILITY_CORE_EXPAND,
  GEMINI_VISIBILITY_FEATHER_BOOST,
} from "@/lib/watermark-config";
import {
  clamp,
  lerp,
  removeWatermarkReverseAlpha,
  compositeWithMask,
  applyMaskedLightness,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type RemovalSettings = {
  corner?: WatermarkCorner | "auto";
  alphaGain?: number;
  feather?: number;
  postLightness?: number;
  edgeReveal?: number;
  innerPunch?: number;
  maskExpand?: number;
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

// ─── Internal helpers ──────────────────────────────────────────────────────────

function boxBlurAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  passes: number,
  bbox: { x: number; y: number; w: number; h: number },
): void {
  if (passes <= 0) return;
  const x0 = Math.max(0, bbox.x);
  const y0 = Math.max(0, bbox.y);
  const x1 = Math.min(width, bbox.x + bbox.w);
  const y1 = Math.min(height, bbox.y + bbox.h);
  const bboxW = x1 - x0;
  const bboxH = y1 - y0;
  /* v8 ignore start */
  if (bboxW <= 0 || bboxH <= 0) return;
  /* v8 ignore stop */
  const src = new Float32Array(bboxW * bboxH);
  for (let p = 0; p < passes; p += 1) {
    for (let by = 0; by < bboxH; by += 1) {
      for (let bx = 0; bx < bboxW; bx += 1) {
        src[by * bboxW + bx] = data[((y0 + by) * width + (x0 + bx)) * 4 + 3];
      }
    }
    for (let by = 0; by < bboxH; by += 1) {
      for (let bx = 0; bx < bboxW; bx += 1) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = by + dy;
          if (ny < 0 || ny >= bboxH) continue;
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = bx + dx;
            if (nx < 0 || nx >= bboxW) continue;
            sum += src[ny * bboxW + nx];
            count += 1;
          }
        }
        data[((y0 + by) * width + (x0 + bx)) * 4 + 3] = Math.round(sum / count);
      }
    }
  }
}

// ─── Exported functions ───────────────────────────────────────────────────────

export function dilateBinary(
  source: Uint8Array,
  rectWidth: number,
  rectHeight: number,
  radius: number,
): Uint8Array {
  if (!(radius > 0)) return source.slice();
  const out = new Uint8Array(source.length);
  for (let row = 0; row < rectHeight; row += 1) {
    for (let col = 0; col < rectWidth; col += 1) {
      let on = 0;
      for (let oy = -radius; oy <= radius && !on; oy += 1) {
        const ny = row + oy;
        if (ny < 0 || ny >= rectHeight) continue;
        for (let ox = -radius; ox <= radius; ox += 1) {
          const nx = col + ox;
          if (nx < 0 || nx >= rectWidth) continue;
          if (source[ny * rectWidth + nx]) {
            on = 1;
            break;
          }
        }
      }
      out[row * rectWidth + col] = on;
    }
  }
  return out;
}

export function buildWeightedMaskData(
  rect: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  featherPx: number,
  alphaMap: Float32Array,
  opts: { threshold?: number; gamma?: number; opacityScale?: number } = {},
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(imageWidth * imageHeight * 4);
  const threshold = Number.isFinite(opts.threshold) ? opts.threshold! : 0;
  const gamma =
    Number.isFinite(opts.gamma) && opts.gamma! > 0 ? opts.gamma! : 1;
  const opacityScale = Number.isFinite(opts.opacityScale)
    ? opts.opacityScale!
    : 1;

  for (let row = 0; row < rect.height; row += 1) {
    for (let col = 0; col < rect.width; col += 1) {
      const srcIdx = row * rect.width + col;
      const dstIdx = ((rect.y + row) * imageWidth + (rect.x + col)) * 4;
      const raw = clamp(alphaMap[srcIdx], 0, 1);
      const normalized =
        raw <= threshold
          ? 0
          : clamp((raw - threshold) / Math.max(1e-6, 1 - threshold), 0, 1);
      const weighted = Math.pow(normalized, gamma) * opacityScale;
      const a = Math.round(clamp(weighted, 0, 1) * 255);
      data[dstIdx] = 255;
      data[dstIdx + 1] = 255;
      data[dstIdx + 2] = 255;
      data[dstIdx + 3] = a;
    }
  }

  const passes = Math.max(0, Math.round(featherPx));
  const blurPad = Math.ceil(featherPx) + 1;
  boxBlurAlpha(data, imageWidth, imageHeight, passes, {
    x: rect.x - blurPad,
    y: rect.y - blurPad,
    w: rect.width + blurPad * 2,
    h: rect.height + blurPad * 2,
  });
  return data;
}

export function buildVisibilityMaskData(
  rect: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  alphaMap: Float32Array,
  opts: {
    feather?: number;
    edgeReveal?: number;
    innerPunch?: number;
    maskExpand?: number;
  } = {},
): Uint8ClampedArray {
  const feather = Number.isFinite(opts.feather) ? opts.feather! : 4;
  const edgeReveal = clamp(
    Number.isFinite(opts.edgeReveal) ? opts.edgeReveal! : 0.92,
    0,
    1.5,
  );
  const innerPunch = clamp(
    Number.isFinite(opts.innerPunch) ? opts.innerPunch! : 1.02,
    0,
    1.5,
  );
  const maskExpand = Math.max(
    0,
    Number.isFinite(opts.maskExpand) ? opts.maskExpand! : 2,
  );

  const edgeNorm = clamp(edgeReveal / 1.5, 0, 1);
  const threshold = lerp(0.05, 0.0015, Math.pow(edgeNorm, 0.82));
  const punchNorm = clamp(innerPunch / 1.5, 0, 1);
  const coreThresholdBase = lerp(0.18, 0.024, Math.pow(punchNorm, 0.78));
  const coreThreshold = Math.max(threshold + 0.015, coreThresholdBase);

  const expand = Math.max(
    0,
    Math.round(
      GEMINI_VISIBILITY_EXPAND + maskExpand + Math.max(0, edgeReveal - 1) * 2,
    ),
  );
  const coreExpand = Math.max(
    expand,
    Math.round(
      GEMINI_VISIBILITY_CORE_EXPAND +
        maskExpand +
        Math.max(0, innerPunch - 1) * 2,
    ),
  );

  const edge = new Uint8Array(rect.width * rect.height);
  const core = new Uint8Array(rect.width * rect.height);
  for (let row = 0; row < rect.height; row += 1) {
    for (let col = 0; col < rect.width; col += 1) {
      const idx = row * rect.width + col;
      const value = alphaMap[idx];
      edge[idx] = value > threshold ? 1 : 0;
      core[idx] = value > coreThreshold ? 1 : 0;
    }
  }

  const expandedEdge = dilateBinary(edge, rect.width, rect.height, expand);
  const expandedCore = dilateBinary(core, rect.width, rect.height, coreExpand);

  const data = new Uint8ClampedArray(imageWidth * imageHeight * 4);
  for (let row = 0; row < rect.height; row += 1) {
    for (let col = 0; col < rect.width; col += 1) {
      const srcIdx = row * rect.width + col;
      if (!expandedEdge[srcIdx] && !expandedCore[srcIdx]) continue;
      const dstIdx = ((rect.y + row) * imageWidth + (rect.x + col)) * 4;
      data[dstIdx] = 255;
      data[dstIdx + 1] = 255;
      data[dstIdx + 2] = 255;
      data[dstIdx + 3] = expandedEdge[srcIdx] ? 255 : 0;
    }
  }

  const passes = Math.max(0, Math.round(feather + GEMINI_VISIBILITY_FEATHER_BOOST));
  const blurPad = Math.ceil(feather + GEMINI_VISIBILITY_FEATHER_BOOST) + expand + 1;
  boxBlurAlpha(data, imageWidth, imageHeight, passes, {
    x: rect.x - blurPad,
    y: rect.y - blurPad,
    w: rect.width + blurPad * 2,
    h: rect.height + blurPad * 2,
  });

  // After blurring, force core pixels to fully opaque
  for (let row = 0; row < rect.height; row += 1) {
    for (let col = 0; col < rect.width; col += 1) {
      const srcIdx = row * rect.width + col;
      if (!expandedCore[srcIdx]) continue;
      data[((rect.y + row) * imageWidth + (rect.x + col)) * 4 + 3] = 255;
    }
  }

  return data;
}

export function buildCorrectionMaskData(
  rect: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  featherPx: number,
  alphaMap: Float32Array,
): Uint8ClampedArray {
  return buildWeightedMaskData(rect, imageWidth, imageHeight, featherPx, alphaMap, {
    threshold: GEMINI_CORRECTION_THRESHOLD,
    gamma: GEMINI_CORRECTION_GAMMA,
  });
}

export function runPipeline(
  img: RawImageData,
  settings: RemovalSettings,
  detection?: DetectionResult | null,
): PipelineResult {
  const alphaGain =
    Number.isFinite(settings.alphaGain) && settings.alphaGain! > 0
      ? settings.alphaGain!
      : 1;
  const feather = Number.isFinite(settings.feather) ? settings.feather! : 4;
  const postLightness = Number.isFinite(settings.postLightness)
    ? settings.postLightness!
    : 0;

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

  const repaired = cloneRawImageData(img);
  removeWatermarkReverseAlpha(repaired, alphaMap, position, {
    alphaGain: effectiveGain,
  });

  const correctionMask = buildCorrectionMaskData(
    position,
    img.width,
    img.height,
    feather,
    alphaMap,
  );
  if (postLightness !== 0) {
    applyMaskedLightness(repaired, correctionMask, postLightness);
  }

  const visibilityMask = buildVisibilityMaskData(
    position,
    img.width,
    img.height,
    alphaMap,
    {
      feather,
      edgeReveal: settings.edgeReveal,
      innerPunch: settings.innerPunch,
      maskExpand: settings.maskExpand,
    },
  );

  const imageData = compositeWithMask(img, repaired, visibilityMask);

  return {
    imageData,
    position,
    alphaMap,
    alphaGain: effectiveGain,
    confidence,
    accepted,
    detectionSource,
  };
}
