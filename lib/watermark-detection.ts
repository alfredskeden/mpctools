import {
  GEMINI_PRESETS,
  GEMINI_OFFICIAL_SIZES,
  GEMINI_CONFIG_BY_TIER,
  GEMINI_DETECTION,
  type WatermarkTier,
} from "@/lib/watermark-config";
import { getEmbeddedGeminiAlphaMap } from "@/lib/watermark-alpha-maps";
import {
  clamp,
  toGrayscale,
  sobelMagnitude,
  getRegion,
  stdDevRegion,
  normalizedCrossCorrelation,
  interpolateAlphaMap,
  warpAlphaMap,
  computeRegionSpatialCorrelation,
  computeRegionGradientCorrelation,
  removeWatermarkReverseAlpha,
  extractRegion,
  type RawImageData,
  type Region,
} from "@/lib/watermark-math";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WatermarkCorner =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export type WatermarkVariant = "auto" | "48" | "96";

export type WatermarkSizeConfig = {
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  marginTop: number;
};

export type CandidatePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CandidateScore = {
  spatialScore: number;
  gradientScore: number;
  varianceScore: number;
  confidence: number;
};

export type ScoredCandidate = CandidateScore & {
  config: WatermarkSizeConfig;
  corner: WatermarkCorner;
  position: CandidatePosition;
  alphaMap: Float32Array;
  warp: { dx: number; dy: number; scale: number };
  source: string;
  adjustedScore: number;
};

export type EvaluatedCandidate = ScoredCandidate & {
  alphaGain: number;
  /** Region-sized processed image (width/height = position.width/height). Not used by runPipeline. */
  imageData: RawImageData;
  originalSpatialScore: number;
  originalGradientScore: number;
  processedSpatialScore: number;
  processedGradientScore: number;
  improvement: number;
  nearBlackRatio: number;
  nearBlackIncrease: number;
  gradientIncrease: number;
  accepted: boolean;
  decisionTier: "direct-match" | "validated-match" | "insufficient";
  validationCost: number;
};

export type DetectionResult = EvaluatedCandidate & {
  config: WatermarkSizeConfig;
  position: CandidatePosition;
};

export type DetectionContext = {
  imageData: RawImageData;
  width: number;
  height: number;
  gray: Float32Array;
  grad: Float32Array;
};

// ─── Config helpers ───────────────────────────────────────────────────────────

export function resolveOfficialGeminiWatermarkConfig(
  width: number,
  height: number,
): WatermarkSizeConfig | null {
  const match = GEMINI_OFFICIAL_SIZES.find(
    (entry) =>
      entry.width === Math.round(width) && entry.height === Math.round(height),
  );
  if (!match) return null;
  const tierConfig = GEMINI_CONFIG_BY_TIER[match.tier as WatermarkTier];
  /* v8 ignore start */
  if (!tierConfig) return null;
  /* v8 ignore stop */
  return { ...tierConfig };
}

export function getDefaultConfig(
  width: number,
  height: number,
): WatermarkSizeConfig {
  const official = resolveOfficialGeminiWatermarkConfig(width, height);
  if (official) return official;
  if (width >= 1024 && height >= 1024) {
    return { ...(GEMINI_PRESETS["96"] as WatermarkSizeConfig) };
  }
  return { ...(GEMINI_PRESETS["48"] as WatermarkSizeConfig) };
}

export function resolveOfficialGeminiSearchConfigs(
  width: number,
  height: number,
  defaultConfig: WatermarkSizeConfig | null,
): WatermarkSizeConfig[] {
  const cfg = GEMINI_DETECTION;
  const normalizedWidth = Math.round(width);
  const normalizedHeight = Math.round(height);
  const targetAspectRatio = normalizedWidth / Math.max(1, normalizedHeight);
  const candidates: { config: WatermarkSizeConfig; score: number }[] = [];

  for (const entry of GEMINI_OFFICIAL_SIZES) {
    const baseConfig = GEMINI_CONFIG_BY_TIER[entry.tier as WatermarkTier];
    /* v8 ignore start */
    if (!baseConfig) continue;
    /* v8 ignore stop */
    const scaleX = normalizedWidth / entry.width;
    const scaleY = normalizedHeight / entry.height;
    const scale = (scaleX + scaleY) / 2;
    const entryAspectRatio = entry.width / entry.height;
    const relativeAspectRatioDelta =
      Math.abs(targetAspectRatio - entryAspectRatio) / entryAspectRatio;
    const scaleMismatchRatio =
      Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY);

    if (relativeAspectRatioDelta > cfg.maxRelativeAspectRatioDelta) continue;
    /* v8 ignore start */
    if (scaleMismatchRatio > cfg.maxScaleMismatchRatio) continue;
    /* v8 ignore stop */

    const config: WatermarkSizeConfig = {
      logoSize: clamp(
        Math.round(baseConfig.logoSize * scale),
        cfg.minLogoSize,
        cfg.maxLogoSize,
      ),
      marginRight: Math.max(8, Math.round(baseConfig.marginRight * scaleX)),
      marginBottom: Math.max(8, Math.round(baseConfig.marginBottom * scaleY)),
      marginLeft: Math.max(8, Math.round(baseConfig.marginLeft * scaleX)),
      marginTop: Math.max(8, Math.round(baseConfig.marginTop * scaleY)),
    };

    const x = normalizedWidth - config.marginRight - config.logoSize;
    const y = normalizedHeight - config.marginBottom - config.logoSize;
    if (x < 0 || y < 0) continue;

    candidates.push({
      config,
      score:
        relativeAspectRatioDelta * 100 +
        scaleMismatchRatio * 20 +
        Math.abs(Math.log2(Math.max(scale, 1e-6))),
    });
  }

  candidates.sort((a, b) => a.score - b.score);
  const deduped: WatermarkSizeConfig[] = [];
  const seen = new Set<string>();
  const fallback = defaultConfig
    ? [defaultConfig, ...candidates.map((c) => c.config)]
    : candidates.map((c) => c.config);

  for (const candidate of fallback) {
    /* v8 ignore start */
    if (!candidate) continue;
    /* v8 ignore stop */
    const key = `${candidate.logoSize}:${candidate.marginRight}:${candidate.marginBottom}:${candidate.marginLeft}:${candidate.marginTop}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...candidate });
    if (
      deduped.length >=
      Math.max(1, cfg.officialSeedLimit + (defaultConfig ? 1 : 0))
    )
      break;
  }
  return deduped;
}

// ─── Alpha map helpers ────────────────────────────────────────────────────────

export function getAlphaMapForSize(size: number): Float32Array | null {
  const numericSize = Math.round(size);
  const exact = getEmbeddedGeminiAlphaMap(numericSize as 48 | 96);
  if (exact) return exact;
  const sourceSize = numericSize <= 72 ? 48 : 96;
  const sourceAlpha = getEmbeddedGeminiAlphaMap(sourceSize);
  /* v8 ignore start */
  if (!sourceAlpha) return null;
  /* v8 ignore stop */
  return interpolateAlphaMap(sourceAlpha, sourceSize, numericSize);
}

// ─── Position helpers ─────────────────────────────────────────────────────────

export function getAnchorPosition(
  config: WatermarkSizeConfig,
  corner: WatermarkCorner,
  width: number,
  height: number,
): CandidatePosition {
  const size = config.logoSize;
  const marginRight = config.marginRight;
  const marginLeft = config.marginLeft;
  const marginBottom = config.marginBottom;
  const marginTop = config.marginTop;
  let x = width - marginRight - size;
  let y = height - marginBottom - size;

  if (corner === "bottom-left") {
    x = marginLeft;
    y = height - marginBottom - size;
  } else if (corner === "top-right") {
    x = width - marginRight - size;
    y = marginTop;
  } else if (corner === "top-left") {
    x = marginLeft;
    y = marginTop;
  }

  return { x, y, width: size, height: size };
}

// ─── Detection context ────────────────────────────────────────────────────────

export function buildDetectionContext(
  imageData: RawImageData,
): DetectionContext {
  const gray = toGrayscale(imageData);
  return {
    imageData,
    width: imageData.width,
    height: imageData.height,
    gray,
    grad: sobelMagnitude(gray, imageData.width, imageData.height),
  };
}

// ─── Candidate scoring ────────────────────────────────────────────────────────

export function scoreCandidate(
  context: DetectionContext,
  alphaMap: Float32Array,
  candidate: Region,
): CandidateScore | null {
  const { x, y, size } = candidate;
  if (
    x < 0 ||
    y < 0 ||
    x + size > context.width ||
    y + size > context.height
  )
    return null;

  const grayRegion = getRegion(context.gray, context.width, x, y, size);
  const gradRegion = getRegion(context.grad, context.width, x, y, size);
  const templateGrad = sobelMagnitude(alphaMap, size, size);
  const spatialScore = normalizedCrossCorrelation(grayRegion, alphaMap);
  const gradientScore = normalizedCrossCorrelation(gradRegion, templateGrad);

  let varianceScore = 0;
  if (y > 8) {
    const refY = Math.max(0, y - size);
    const refH = Math.min(size, y - refY);
    if (refH > 8) {
      const wmStd = stdDevRegion(context.gray, context.width, x, y, size);
      const refStd = stdDevRegion(
        context.gray,
        context.width,
        x,
        refY,
        refH,
      );
      if (refStd > 1e-8) {
        varianceScore = clamp(1 - wmStd / refStd, 0, 1);
      }
    }
  }

  const confidence = clamp(
    Math.max(0, spatialScore) * 0.5 +
      Math.max(0, gradientScore) * 0.3 +
      varianceScore * 0.2,
    0,
    1,
  );
  return { spatialScore, gradientScore, varianceScore, confidence };
}

// ─── Candidate generation ─────────────────────────────────────────────────────

export function getCandidateSizeList(seedSize: number): number[] {
  const set = new Set([Math.round(seedSize)]);
  const factors =
    seedSize <= 56
      ? [0.92, 0.96, 1, 1.04, 1.08]
      : [0.94, 0.97, 1, 1.03, 1.06];
  for (const factor of factors) {
    set.add(
      clamp(
        Math.round(seedSize * factor),
        GEMINI_DETECTION.minLogoSize,
        GEMINI_DETECTION.maxLogoSize,
      ),
    );
  }
  return [...set].sort((a, b) => a - b);
}

export function getCornerCandidates(
  corner: WatermarkCorner | "auto",
): WatermarkCorner[] {
  if (corner !== "auto") return [corner];
  return ["bottom-right", "bottom-left", "top-right", "top-left"];
}

export function pushTopCandidate(
  list: ScoredCandidate[],
  candidate: ScoredCandidate,
  limit = 10,
): void {
  list.push(candidate);
  list.sort((a, b) => {
    if (b.adjustedScore !== a.adjustedScore)
      return b.adjustedScore - a.adjustedScore;
    return b.confidence - a.confidence;
  });
  if (list.length > limit) list.length = limit;
}

export function buildSearchConfigs(
  width: number,
  height: number,
  forcedVariant: WatermarkVariant | null = null,
): WatermarkSizeConfig[] {
  if (forcedVariant === "48" || forcedVariant === "96") {
    return [{ ...(GEMINI_PRESETS[forcedVariant] as WatermarkSizeConfig) }];
  }
  const defaultConfig = getDefaultConfig(width, height);
  return resolveOfficialGeminiSearchConfigs(width, height, defaultConfig);
}

export function buildCandidateConfig(
  seedConfig: WatermarkSizeConfig,
  candidateSize: number,
): WatermarkSizeConfig {
  const factor = candidateSize / Math.max(1, seedConfig.logoSize);
  return {
    logoSize: candidateSize,
    marginRight: Math.max(8, Math.round(seedConfig.marginRight * factor)),
    marginBottom: Math.max(8, Math.round(seedConfig.marginBottom * factor)),
    marginLeft: Math.max(8, Math.round(seedConfig.marginLeft * factor)),
    marginTop: Math.max(8, Math.round(seedConfig.marginTop * factor)),
  };
}

// ─── Search pipeline ──────────────────────────────────────────────────────────

export function searchCandidatePool(
  context: DetectionContext,
  opts: {
    forcedVariant?: WatermarkVariant | null;
    corner?: WatermarkCorner | "auto";
  } = {},
): ScoredCandidate[] {
  const forcedVariant = opts.forcedVariant ?? null;
  const cornerArg = opts.corner ?? "auto";
  const corners = getCornerCandidates(cornerArg);
  const configs = buildSearchConfigs(context.width, context.height, forcedVariant);
  const topCandidates: ScoredCandidate[] = [];
  const offsets = GEMINI_DETECTION.searchOffsets;

  for (const seedConfig of configs) {
    const candidateSizes = getCandidateSizeList(seedConfig.logoSize);
    for (const candidateSize of candidateSizes) {
      const config = buildCandidateConfig(seedConfig, candidateSize);
      const alphaMap = getAlphaMapForSize(candidateSize);
      /* v8 ignore start */
      if (!alphaMap) continue;
      /* v8 ignore stop */

      for (const corner of corners) {
        const anchor = getAnchorPosition(
          config,
          corner,
          context.width,
          context.height,
        );
        for (const dy of offsets) {
          for (const dx of offsets) {
            const px = anchor.x + dx;
            const py = anchor.y + dy;
            if (
              px < 0 ||
              py < 0 ||
              px + candidateSize > context.width ||
              py + candidateSize > context.height
            )
              continue;

            const score = scoreCandidate(context, alphaMap, {
              x: px,
              y: py,
              size: candidateSize,
            });
            /* v8 ignore start */
            if (!score) continue;
            /* v8 ignore stop */

            pushTopCandidate(
              topCandidates,
              {
                config,
                corner,
                position: {
                  x: px,
                  y: py,
                  width: candidateSize,
                  height: candidateSize,
                },
                alphaMap,
                warp: { dx: 0, dy: 0, scale: 1 },
                source: "search",
                ...score,
                adjustedScore:
                  score.confidence *
                  Math.min(1, Math.sqrt(candidateSize / 96)),
              },
              12,
            );
          }
        }
      }
    }
  }

  return topCandidates;
}

export function refineCandidateAlignment(
  context: DetectionContext,
  candidate: ScoredCandidate,
): ScoredCandidate {
  let best = candidate;
  const shifts = GEMINI_DETECTION.templateShiftOffsets;
  const scales = GEMINI_DETECTION.templateScaleOffsets;

  for (const scale of scales) {
    for (const dy of shifts) {
      for (const dx of shifts) {
        if (dx === 0 && dy === 0 && scale === 1) continue;
        const warpedAlpha = warpAlphaMap(
          candidate.alphaMap,
          candidate.position.width,
          { dx, dy, scale },
        );
        const score = scoreCandidate(context, warpedAlpha, {
          x: candidate.position.x,
          y: candidate.position.y,
          size: candidate.position.width,
        });
        /* v8 ignore start */
        if (!score) continue;
        /* v8 ignore stop */
        const adjustedScore =
          score.confidence *
          Math.min(1, Math.sqrt(candidate.position.width / 96));
        if (adjustedScore > best.adjustedScore + 0.01) {
          best = {
            ...candidate,
            alphaMap: warpedAlpha,
            warp: { dx, dy, scale },
            ...score,
            adjustedScore,
          };
        }
      }
    }
  }

  return best;
}

// ─── Restoration evaluation ───────────────────────────────────────────────────

export function calculateNearBlackRatio(
  imageData: RawImageData,
  position: CandidatePosition,
): number {
  let nearBlack = 0;
  let total = 0;
  for (let row = 0; row < position.height; row += 1) {
    for (let col = 0; col < position.width; col += 1) {
      const idx =
        ((position.y + row) * imageData.width + (position.x + col)) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      if (r <= 5 && g <= 5 && b <= 5) nearBlack += 1;
      total += 1;
    }
  }
  return total ? nearBlack / total : 0;
}

function computeDecisionTier(
  accepted: boolean,
  confidence: number,
): "direct-match" | "validated-match" | "insufficient" {
  if (!accepted) return "insufficient";
  if (confidence >= GEMINI_DETECTION.adaptiveConfidenceThreshold)
    return "direct-match";
  return "validated-match";
}

export function evaluateRestorationCandidate(
  originalImageData: RawImageData,
  candidate: ScoredCandidate,
  alphaGain: number,
): EvaluatedCandidate {
  const { position, alphaMap } = candidate;
  const regionPos = { x: 0, y: 0, width: position.width, height: position.height };
  const regionAsRegion = { x: 0, y: 0, size: position.width };

  const baselineNearBlackRatio = calculateNearBlackRatio(
    originalImageData,
    position,
  );
  const originalSpatialScore = candidate.spatialScore;
  const originalGradientScore = candidate.gradientScore;

  // Extract only the watermark region (~96×96 px) instead of cloning the full image.
  // runPipeline does not use imageData, so full-image clones are wasteful.
  const regionImg = extractRegion(originalImageData, position);
  removeWatermarkReverseAlpha(regionImg, alphaMap, regionPos, { alphaGain });

  const processedSpatialScore = computeRegionSpatialCorrelation(
    regionImg,
    alphaMap,
    regionAsRegion,
  );
  const processedGradientScore = computeRegionGradientCorrelation(
    regionImg,
    alphaMap,
    regionAsRegion,
  );
  const nearBlackRatio = calculateNearBlackRatio(regionImg, regionPos);
  const nearBlackIncrease = nearBlackRatio - baselineNearBlackRatio;
  const improvement = originalSpatialScore - processedSpatialScore;
  const gradientIncrease = processedGradientScore - originalGradientScore;

  const accepted =
    nearBlackIncrease <= GEMINI_DETECTION.maxNearBlackRatioIncrease &&
    improvement >= GEMINI_DETECTION.minAcceptedImprovement &&
    (Math.abs(processedSpatialScore) <= GEMINI_DETECTION.targetResidual ||
      gradientIncrease <= GEMINI_DETECTION.maxGradientIncrease);

  return {
    ...candidate,
    alphaGain,
    imageData: regionImg,
    originalSpatialScore,
    originalGradientScore,
    processedSpatialScore,
    processedGradientScore,
    improvement,
    nearBlackRatio,
    nearBlackIncrease,
    gradientIncrease,
    accepted,
    decisionTier: computeDecisionTier(accepted, candidate.confidence),
    validationCost:
      Math.abs(processedSpatialScore) +
      Math.max(0, processedGradientScore) * 0.6 +
      Math.max(0, nearBlackIncrease) * 3,
  };
}

export function pickBetterCandidate(
  currentBest: EvaluatedCandidate | null,
  candidate: EvaluatedCandidate | null,
  minCostDelta = 0.005,
): EvaluatedCandidate | null {
  if (!candidate) return currentBest;
  if (!currentBest) return candidate;
  if (candidate.accepted && !currentBest.accepted) return candidate;
  if (!candidate.accepted && currentBest.accepted) return currentBest;
  if (candidate.validationCost < currentBest.validationCost - minCostDelta)
    return candidate;
  if (
    Math.abs(candidate.validationCost - currentBest.validationCost) <=
      minCostDelta &&
    candidate.improvement > currentBest.improvement + 0.01
  )
    return candidate;
  if (
    !currentBest.accepted &&
    !candidate.accepted &&
    candidate.confidence > currentBest.confidence + 0.03
  )
    return candidate;
  return currentBest;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function detectBestCandidate(
  img: RawImageData,
  opts: {
    forcedVariant?: WatermarkVariant | null;
    corner?: WatermarkCorner | "auto";
    alphaGain?: number;
  } = {},
): DetectionResult | null {
  const context = buildDetectionContext(img);
  const pool = searchCandidatePool(context, {
    forcedVariant: opts.forcedVariant ?? null,
    corner: opts.corner ?? "auto",
  });
  if (!pool.length) return null;

  const refined = pool.map((candidate) =>
    refineCandidateAlignment(context, candidate),
  );

  const gainCandidates = Array.from(
    new Set(
      [
        ...GEMINI_DETECTION.alphaGainCandidates,
        ...(opts.alphaGain !== undefined ? [opts.alphaGain] : []),
      ]
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0),
    ),
  );

  let best: EvaluatedCandidate | null = null;
  for (const candidate of refined) {
    for (const gain of gainCandidates) {
      const evaluated = evaluateRestorationCandidate(img, candidate, gain);
      best = pickBetterCandidate(best, evaluated, 0.002);
    }
  }

  /* v8 ignore start */
  if (!best) return null;
  /* v8 ignore stop */
  return {
    ...best,
    config: { ...best.config },
    position: { ...best.position },
  };
}
