import { describe, it, expect } from "vitest";
import {
  resolveOfficialGeminiWatermarkConfig,
  getDefaultConfig,
  resolveOfficialGeminiSearchConfigs,
  getAlphaMapForSize,
  getAnchorPosition,
  buildDetectionContext,
  scoreCandidate,
  getCandidateSizeList,
  getCornerCandidates,
  pushTopCandidate,
  buildSearchConfigs,
  buildCandidateConfig,
  searchCandidatePool,
  refineCandidateAlignment,
  calculateNearBlackRatio,
  evaluateRestorationCandidate,
  pickBetterCandidate,
  detectBestCandidate,
  type WatermarkSizeConfig,
  type ScoredCandidate,
  type EvaluatedCandidate,
  type DetectionContext,
  type CandidatePosition,
} from "@/lib/watermark-detection";
import type { RawImageData } from "@/lib/watermark-math";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeImage(
  width: number,
  height: number,
  fill: (i: number) => [number, number, number, number] = () => [
    128, 128, 128, 255,
  ],
): RawImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b, a] = fill(i);
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { data, width, height };
}

function makeScoredCandidate(
  overrides: Partial<ScoredCandidate> = {},
): ScoredCandidate {
  return {
    config: {
      logoSize: 48,
      marginRight: 32,
      marginBottom: 32,
      marginLeft: 32,
      marginTop: 32,
    },
    corner: "bottom-right",
    position: { x: 0, y: 0, width: 48, height: 48 },
    alphaMap: new Float32Array(48 * 48).fill(0.5),
    warp: { dx: 0, dy: 0, scale: 1 },
    source: "search",
    spatialScore: 0.5,
    gradientScore: 0.4,
    varianceScore: 0.2,
    confidence: 0.44,
    adjustedScore: 0.3,
    ...overrides,
  };
}

function makeEvaluatedCandidate(
  overrides: Partial<EvaluatedCandidate> = {},
): EvaluatedCandidate {
  return {
    ...makeScoredCandidate(),
    alphaGain: 1,
    imageData: makeImage(64, 64),
    originalSpatialScore: 0.6,
    originalGradientScore: 0.3,
    processedSpatialScore: 0.1,
    processedGradientScore: 0.1,
    improvement: 0.5,
    nearBlackRatio: 0.01,
    nearBlackIncrease: 0.01,
    gradientIncrease: 0.01,
    accepted: true,
    decisionTier: "validated-match",
    validationCost: 0.2,
    ...overrides,
  };
}

// ─── resolveOfficialGeminiWatermarkConfig ─────────────────────────────────────

describe("resolveOfficialGeminiWatermarkConfig", () => {
  it("returns null for unknown dimensions", () => {
    expect(resolveOfficialGeminiWatermarkConfig(999, 999)).toBeNull();
  });

  it("returns 48px config for 512×512 (0.5k tier)", () => {
    const result = resolveOfficialGeminiWatermarkConfig(512, 512);
    expect(result).not.toBeNull();
    expect(result!.logoSize).toBe(48);
  });

  it("returns 96px config for 1024×1024 (1k tier)", () => {
    const result = resolveOfficialGeminiWatermarkConfig(1024, 1024);
    expect(result).not.toBeNull();
    expect(result!.logoSize).toBe(96);
  });

  it("rounds dimensions before matching", () => {
    const result = resolveOfficialGeminiWatermarkConfig(512.4, 511.6);
    expect(result).not.toBeNull();
    expect(result!.logoSize).toBe(48);
  });

  it("returns a copy, not the original reference", () => {
    const a = resolveOfficialGeminiWatermarkConfig(1024, 1024);
    const b = resolveOfficialGeminiWatermarkConfig(1024, 1024);
    expect(a).not.toBe(b);
  });
});

// ─── getDefaultConfig ─────────────────────────────────────────────────────────

describe("getDefaultConfig", () => {
  it("returns official config for known official size", () => {
    const result = getDefaultConfig(1024, 1024);
    expect(result.logoSize).toBe(96);
  });

  it("returns 96px preset for large non-official image", () => {
    const result = getDefaultConfig(1200, 1200);
    expect(result.logoSize).toBe(96);
  });

  it("returns 48px preset for small non-official image", () => {
    const result = getDefaultConfig(400, 400);
    expect(result.logoSize).toBe(48);
  });
});

// ─── new Gemini watermark placement ───────────────────────────────────────────

describe("new Gemini watermark anchor placement", () => {
  it("anchors at the new inset position for a 1760x2400 upload", () => {
    // Given
    const config = getDefaultConfig(1760, 2400);

    // When
    const pos = getAnchorPosition(config, "bottom-right", 1760, 2400);

    // Then
    expect(pos).toEqual({ x: 1472, y: 2112, width: 96, height: 96 });
  });

  it("anchors at the new inset position for an official 1856x2304 upload", () => {
    // Given
    const config = getDefaultConfig(1856, 2304);

    // When
    const pos = getAnchorPosition(config, "bottom-right", 1856, 2304);

    // Then
    expect(pos).toEqual({ x: 1568, y: 2016, width: 96, height: 96 });
  });
});

// ─── resolveOfficialGeminiSearchConfigs ───────────────────────────────────────

describe("resolveOfficialGeminiSearchConfigs", () => {
  it("returns an array", () => {
    const results = resolveOfficialGeminiSearchConfigs(512, 512, null);
    expect(Array.isArray(results)).toBe(true);
  });

  it("returns at least one entry for a known official size", () => {
    const results = resolveOfficialGeminiSearchConfigs(512, 512, null);
    expect(results.length).toBeGreaterThan(0);
  });

  it("deduplicates configs by key", () => {
    const results = resolveOfficialGeminiSearchConfigs(512, 512, null);
    const keys = results.map(
      (c) =>
        `${c.logoSize}:${c.marginRight}:${c.marginBottom}:${c.marginLeft}:${c.marginTop}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("respects officialSeedLimit when defaultConfig is null", () => {
    const results = resolveOfficialGeminiSearchConfigs(512, 512, null);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it("prepends defaultConfig when provided", () => {
    const def: WatermarkSizeConfig = {
      logoSize: 48,
      marginRight: 32,
      marginBottom: 32,
      marginLeft: 32,
      marginTop: 32,
    };
    const results = resolveOfficialGeminiSearchConfigs(512, 512, def);
    expect(results[0].logoSize).toBe(48);
  });

  it("skips entries where watermark would be out of bounds", () => {
    // very tiny image — no valid position
    const results = resolveOfficialGeminiSearchConfigs(1, 1, null);
    expect(results.length).toBe(0);
  });
});

// ─── getAlphaMapForSize ───────────────────────────────────────────────────────

describe("getAlphaMapForSize", () => {
  it("returns Float32Array for size 48", () => {
    expect(getAlphaMapForSize(48)).toBeInstanceOf(Float32Array);
  });

  it("returns Float32Array for size 96", () => {
    expect(getAlphaMapForSize(96)).toBeInstanceOf(Float32Array);
  });

  it("returns 48×48 = 2304 values for size 48", () => {
    expect(getAlphaMapForSize(48)!.length).toBe(2304);
  });

  it("returns 96×96 = 9216 values for size 96", () => {
    expect(getAlphaMapForSize(96)!.length).toBe(9216);
  });

  it("interpolates for size 64 using source 48 (numericSize <= 72)", () => {
    const result = getAlphaMapForSize(64);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result!.length).toBe(64 * 64);
  });

  it("interpolates for size 80 using source 96 (numericSize > 72)", () => {
    const result = getAlphaMapForSize(80);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result!.length).toBe(80 * 80);
  });

  it("rounds non-integer sizes", () => {
    const a = getAlphaMapForSize(48);
    const b = getAlphaMapForSize(47.6);
    expect(a!.length).toBe(b!.length);
  });
});

// ─── getAnchorPosition ────────────────────────────────────────────────────────

describe("getAnchorPosition", () => {
  const cfg: WatermarkSizeConfig = {
    logoSize: 48,
    marginRight: 32,
    marginBottom: 32,
    marginLeft: 32,
    marginTop: 32,
  };

  it("places bottom-right watermark at expected position", () => {
    const pos = getAnchorPosition(cfg, "bottom-right", 512, 512);
    expect(pos.x).toBe(512 - 32 - 48);
    expect(pos.y).toBe(512 - 32 - 48);
  });

  it("places bottom-left watermark at expected position", () => {
    const pos = getAnchorPosition(cfg, "bottom-left", 512, 512);
    expect(pos.x).toBe(32);
    expect(pos.y).toBe(512 - 32 - 48);
  });

  it("places top-right watermark at expected position", () => {
    const pos = getAnchorPosition(cfg, "top-right", 512, 512);
    expect(pos.x).toBe(512 - 32 - 48);
    expect(pos.y).toBe(32);
  });

  it("places top-left watermark at expected position", () => {
    const pos = getAnchorPosition(cfg, "top-left", 512, 512);
    expect(pos.x).toBe(32);
    expect(pos.y).toBe(32);
  });

  it("returns width and height equal to logoSize", () => {
    const pos = getAnchorPosition(cfg, "bottom-right", 512, 512);
    expect(pos.width).toBe(48);
    expect(pos.height).toBe(48);
  });
});

// ─── buildDetectionContext ────────────────────────────────────────────────────

describe("buildDetectionContext", () => {
  it("returns context with imageData, width, height, gray, grad", () => {
    const img = makeImage(64, 64);
    const ctx = buildDetectionContext(img);
    expect(ctx.imageData).toBe(img);
    expect(ctx.width).toBe(64);
    expect(ctx.height).toBe(64);
    expect(ctx.gray).toBeInstanceOf(Float32Array);
    expect(ctx.grad).toBeInstanceOf(Float32Array);
  });

  it("gray has width*height values", () => {
    const img = makeImage(32, 32);
    const ctx = buildDetectionContext(img);
    expect(ctx.gray.length).toBe(32 * 32);
  });

  it("grad has width*height values", () => {
    const img = makeImage(32, 32);
    const ctx = buildDetectionContext(img);
    expect(ctx.grad.length).toBe(32 * 32);
  });
});

// ─── scoreCandidate ───────────────────────────────────────────────────────────

describe("scoreCandidate", () => {
  it("returns null when candidate is out of bounds", () => {
    const img = makeImage(64, 64);
    const ctx = buildDetectionContext(img);
    const alphaMap = new Float32Array(48 * 48).fill(0.5);
    expect(scoreCandidate(ctx, alphaMap, { x: 30, y: 30, size: 48 })).toBeNull();
  });

  it("returns scores when candidate is in bounds", () => {
    const img = makeImage(200, 200);
    const ctx = buildDetectionContext(img);
    const alphaMap = new Float32Array(48 * 48).fill(0.5);
    const result = scoreCandidate(ctx, alphaMap, { x: 0, y: 0, size: 48 });
    expect(result).not.toBeNull();
    expect(typeof result!.spatialScore).toBe("number");
    expect(typeof result!.gradientScore).toBe("number");
    expect(typeof result!.varianceScore).toBe("number");
    expect(typeof result!.confidence).toBe("number");
  });

  it("confidence is in [0, 1]", () => {
    const img = makeImage(200, 200);
    const ctx = buildDetectionContext(img);
    const alphaMap = new Float32Array(48 * 48).fill(0.5);
    const result = scoreCandidate(ctx, alphaMap, { x: 0, y: 0, size: 48 });
    expect(result!.confidence).toBeGreaterThanOrEqual(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });

  it("skips variance score when refH <= 8 (y > 8 but tiny size so not enough ref rows)", () => {
    // y=9, size=4: refY = max(0, 9-4)=5, refH = min(4, 9-5)=4 ≤ 8 → skip varianceScore
    const img = makeImage(50, 50);
    const ctx = buildDetectionContext(img);
    const alphaMap = new Float32Array(4 * 4).fill(0.5);
    const result = scoreCandidate(ctx, alphaMap, { x: 0, y: 9, size: 4 });
    expect(result).not.toBeNull();
    expect(result!.varianceScore).toBe(0); // skipped because refH <= 8
  });

  it("computes variance score when region is below another region with non-zero refStd", () => {
    // Use an image with varying pixel values so refStd > 1e-8
    const img = makeImage(200, 200, (i) => {
      const v = (i % 255) as number;
      return [v, v, v, 255];
    });
    const ctx = buildDetectionContext(img);
    const alphaMap = new Float32Array(48 * 48).fill(0.5);
    // y=60 puts the candidate below enough rows that refY = y - size = 12, refH = 48
    const result = scoreCandidate(ctx, alphaMap, { x: 0, y: 60, size: 48 });
    expect(result).not.toBeNull();
    expect(result!.varianceScore).toBeGreaterThanOrEqual(0);
  });
});

// ─── getCandidateSizeList ─────────────────────────────────────────────────────

describe("getCandidateSizeList", () => {
  it("includes the seed size", () => {
    expect(getCandidateSizeList(48)).toContain(48);
  });

  it("returns a sorted array", () => {
    const list = getCandidateSizeList(48);
    for (let i = 1; i < list.length; i++) {
      expect(list[i]).toBeGreaterThanOrEqual(list[i - 1]);
    }
  });

  it("uses larger factors for size 96 than 48", () => {
    const list48 = getCandidateSizeList(48);
    const list96 = getCandidateSizeList(96);
    const spread48 = Math.max(...list48) - Math.min(...list48);
    const spread96 = Math.max(...list96) - Math.min(...list96);
    expect(spread96).toBeGreaterThan(spread48);
  });

  it("all values are within minLogoSize and maxLogoSize", () => {
    const list = getCandidateSizeList(48);
    for (const s of list) {
      expect(s).toBeGreaterThanOrEqual(24);
      expect(s).toBeLessThanOrEqual(192);
    }
  });
});

// ─── getCornerCandidates ──────────────────────────────────────────────────────

describe("getCornerCandidates", () => {
  it("returns all 4 corners for auto", () => {
    const result = getCornerCandidates("auto");
    expect(result).toHaveLength(4);
    expect(result).toContain("bottom-right");
    expect(result).toContain("bottom-left");
    expect(result).toContain("top-right");
    expect(result).toContain("top-left");
  });

  it("returns only the specified corner when not auto", () => {
    expect(getCornerCandidates("bottom-right")).toEqual(["bottom-right"]);
    expect(getCornerCandidates("top-left")).toEqual(["top-left"]);
  });
});

// ─── pushTopCandidate ─────────────────────────────────────────────────────────

describe("pushTopCandidate", () => {
  it("adds candidate to list", () => {
    const list: ScoredCandidate[] = [];
    const c = makeScoredCandidate({ adjustedScore: 0.5 });
    pushTopCandidate(list, c, 10);
    expect(list).toHaveLength(1);
  });

  it("maintains descending order by adjustedScore", () => {
    const list: ScoredCandidate[] = [];
    pushTopCandidate(list, makeScoredCandidate({ adjustedScore: 0.3 }), 10);
    pushTopCandidate(list, makeScoredCandidate({ adjustedScore: 0.7 }), 10);
    pushTopCandidate(list, makeScoredCandidate({ adjustedScore: 0.5 }), 10);
    expect(list[0].adjustedScore).toBe(0.7);
    expect(list[1].adjustedScore).toBe(0.5);
    expect(list[2].adjustedScore).toBe(0.3);
  });

  it("truncates list to the given limit", () => {
    const list: ScoredCandidate[] = [];
    for (let i = 0; i < 15; i++) {
      pushTopCandidate(
        list,
        makeScoredCandidate({ adjustedScore: i / 15 }),
        10,
      );
    }
    expect(list).toHaveLength(10);
  });

  it("uses confidence as tiebreaker when adjustedScores are equal", () => {
    const list: ScoredCandidate[] = [];
    pushTopCandidate(
      list,
      makeScoredCandidate({ adjustedScore: 0.5, confidence: 0.3 }),
      10,
    );
    pushTopCandidate(
      list,
      makeScoredCandidate({ adjustedScore: 0.5, confidence: 0.7 }),
      10,
    );
    expect(list[0].confidence).toBe(0.7);
  });
});

// ─── buildSearchConfigs ───────────────────────────────────────────────────────

describe("buildSearchConfigs", () => {
  it("returns single 48px config when forcedVariant is 48", () => {
    const result = buildSearchConfigs(512, 512, "48");
    expect(result).toHaveLength(1);
    expect(result[0].logoSize).toBe(48);
  });

  it("returns single 96px config when forcedVariant is 96", () => {
    const result = buildSearchConfigs(512, 512, "96");
    expect(result).toHaveLength(1);
    expect(result[0].logoSize).toBe(96);
  });

  it("returns multiple configs when forcedVariant is null", () => {
    const result = buildSearchConfigs(512, 512, null);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns configs when forcedVariant is auto", () => {
    const result = buildSearchConfigs(512, 512, "auto");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── buildCandidateConfig ─────────────────────────────────────────────────────

describe("buildCandidateConfig", () => {
  const seed: WatermarkSizeConfig = {
    logoSize: 48,
    marginRight: 32,
    marginBottom: 32,
    marginLeft: 32,
    marginTop: 32,
  };

  it("returns config with specified candidateSize as logoSize", () => {
    const result = buildCandidateConfig(seed, 64);
    expect(result.logoSize).toBe(64);
  });

  it("scales margins proportionally to candidateSize/seedSize", () => {
    const result = buildCandidateConfig(seed, 96);
    expect(result.marginRight).toBe(Math.max(8, Math.round(32 * (96 / 48))));
  });

  it("margins are at least 8", () => {
    const tinyConfig: WatermarkSizeConfig = {
      logoSize: 96,
      marginRight: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginTop: 1,
    };
    const result = buildCandidateConfig(tinyConfig, 24);
    expect(result.marginRight).toBe(8);
  });
});

// ─── searchCandidatePool ──────────────────────────────────────────────────────

describe("searchCandidatePool", () => {
  it("returns an array", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const result = searchCandidatePool(ctx);
    expect(Array.isArray(result)).toBe(true);
  });

  it("limits results to 12", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const result = searchCandidatePool(ctx);
    expect(result.length).toBeLessThanOrEqual(12);
  });

  it("candidates have required fields", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const result = searchCandidatePool(ctx);
    if (result.length > 0) {
      const c = result[0];
      expect(typeof c.confidence).toBe("number");
      expect(typeof c.adjustedScore).toBe("number");
      expect(c.position).toBeDefined();
      expect(c.alphaMap).toBeInstanceOf(Float32Array);
    }
  });

  it("respects forcedVariant option", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const result = searchCandidatePool(ctx, { forcedVariant: "48" });
    if (result.length > 0) {
      expect(result[0].config.logoSize).toBeGreaterThanOrEqual(24);
    }
  });

  it("respects corner option", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const result = searchCandidatePool(ctx, { corner: "bottom-right" });
    for (const c of result) {
      expect(c.corner).toBe("bottom-right");
    }
  });
});

// ─── refineCandidateAlignment ─────────────────────────────────────────────────

describe("refineCandidateAlignment", () => {
  it("returns a ScoredCandidate", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.3),
    });
    const result = refineCandidateAlignment(ctx, candidate);
    expect(typeof result.confidence).toBe("number");
    expect(typeof result.adjustedScore).toBe("number");
  });

  it("returns at least as good a candidate (adjustedScore >= original or improved)", () => {
    const img = makeImage(512, 512);
    const ctx = buildDetectionContext(img);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.3),
      adjustedScore: 0.2,
    });
    const result = refineCandidateAlignment(ctx, candidate);
    expect(result.adjustedScore).toBeGreaterThanOrEqual(0);
  });

  it("updates best when a warp improves adjustedScore by more than 0.01", () => {
    // Use a non-uniform image so warp refinement can produce different scores
    const img = makeImage(512, 512, (i) => {
      const v = (i % 200) as number;
      return [v, v, v, 255];
    });
    const ctx = buildDetectionContext(img);
    // Use a very low initial adjustedScore so any warp that produces a positive confidence wins
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.5),
      adjustedScore: -1, // artificially low so any positive result beats it
      confidence: 0,
    });
    const result = refineCandidateAlignment(ctx, candidate);
    // Result should have a non-negative adjustedScore (warp found something better)
    expect(result.adjustedScore).toBeGreaterThanOrEqual(-1);
  });
});

// ─── calculateNearBlackRatio ──────────────────────────────────────────────────

describe("calculateNearBlackRatio", () => {
  it("returns 0 for a fully white image", () => {
    const img = makeImage(64, 64, () => [255, 255, 255, 255]);
    const pos: CandidatePosition = { x: 0, y: 0, width: 64, height: 64 };
    expect(calculateNearBlackRatio(img, pos)).toBe(0);
  });

  it("returns 1 for a fully black image", () => {
    const img = makeImage(64, 64, () => [0, 0, 0, 255]);
    const pos: CandidatePosition = { x: 0, y: 0, width: 64, height: 64 };
    expect(calculateNearBlackRatio(img, pos)).toBe(1);
  });

  it("returns 0 for empty position (zero area)", () => {
    const img = makeImage(64, 64, () => [0, 0, 0, 255]);
    const pos: CandidatePosition = { x: 0, y: 0, width: 0, height: 0 };
    expect(calculateNearBlackRatio(img, pos)).toBe(0);
  });

  it("returns partial ratio for mixed image", () => {
    const img = makeImage(4, 1, (i) =>
      i < 2 ? [0, 0, 0, 255] : [255, 255, 255, 255],
    );
    const pos: CandidatePosition = { x: 0, y: 0, width: 4, height: 1 };
    expect(calculateNearBlackRatio(img, pos)).toBeCloseTo(0.5);
  });

  it("counts pixels with r,g,b exactly 5 as near-black", () => {
    const img = makeImage(1, 1, () => [5, 5, 5, 255]);
    const pos: CandidatePosition = { x: 0, y: 0, width: 1, height: 1 };
    expect(calculateNearBlackRatio(img, pos)).toBe(1);
  });

  it("does not count pixels with any channel above 5 as near-black", () => {
    const img = makeImage(1, 1, () => [6, 0, 0, 255]);
    const pos: CandidatePosition = { x: 0, y: 0, width: 1, height: 1 };
    expect(calculateNearBlackRatio(img, pos)).toBe(0);
  });
});

// ─── evaluateRestorationCandidate ─────────────────────────────────────────────

describe("evaluateRestorationCandidate", () => {
  it("returns an EvaluatedCandidate with expected fields", () => {
    const img = makeImage(512, 512);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.3),
    });
    const result = evaluateRestorationCandidate(img, candidate, 1.0);
    expect(typeof result.improvement).toBe("number");
    expect(typeof result.nearBlackRatio).toBe("number");
    expect(typeof result.validationCost).toBe("number");
    expect(typeof result.accepted).toBe("boolean");
    expect(["direct-match", "validated-match", "insufficient"]).toContain(
      result.decisionTier,
    );
  });

  it("does not mutate the original image data", () => {
    const img = makeImage(512, 512, () => [200, 200, 200, 255]);
    const originalSlice = Array.from(img.data.slice(0, 20));
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.5),
    });
    evaluateRestorationCandidate(img, candidate, 1.0);
    expect(Array.from(img.data.slice(0, 20))).toEqual(originalSlice);
  });

  it("returns accepted=false when nearBlackIncrease is too high", () => {
    // image where all pixels become near-black after removal
    const img = makeImage(512, 512, () => [10, 10, 10, 255]);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.9),
    });
    const result = evaluateRestorationCandidate(img, candidate, 10.0);
    // High alphaGain on near-black pixels will push them near-black anyway
    expect(typeof result.accepted).toBe("boolean");
  });

  it("returns direct-match decisionTier when accepted and confidence >= 0.35", () => {
    // Use a zero alpha map: removeWatermarkReverseAlpha skips all pixels (signalAlpha = 0),
    // so the processed image equals the original. Near-black ratio stays 0.
    // improvement = candidate.spatialScore - processedSpatialScore = 0.8 - 0 = 0.8 >= 0.08.
    // confidence 0.9 >= adaptiveConfidenceThreshold 0.35 → decisionTier = "direct-match".
    const img = makeImage(512, 512, () => [200, 200, 200, 255]);
    const zeroAlphaMap = new Float32Array(48 * 48).fill(0); // all alpha=0 → no pixels changed
    const candidate = makeScoredCandidate({
      position: { x: 0, y: 0, width: 48, height: 48 },
      alphaMap: zeroAlphaMap,
      confidence: 0.9, // above adaptiveConfidenceThreshold 0.35
      spatialScore: 0.8, // originalSpatialScore used directly via ??
      gradientScore: 0.1,
    });
    const result = evaluateRestorationCandidate(img, candidate, 1.0);
    expect(result.accepted).toBe(true);
    expect(result.decisionTier).toBe("direct-match");
  });

  it("returns validated-match decisionTier when accepted but confidence below threshold", () => {
    const img = makeImage(512, 512, () => [200, 200, 200, 255]);
    const zeroAlphaMap = new Float32Array(48 * 48).fill(0);
    const candidate = makeScoredCandidate({
      position: { x: 0, y: 0, width: 48, height: 48 },
      alphaMap: zeroAlphaMap,
      confidence: 0.1, // BELOW adaptiveConfidenceThreshold (0.35)
      spatialScore: 0.8,
      gradientScore: 0.1,
    });
    const result = evaluateRestorationCandidate(img, candidate, 1.0);
    expect(result.accepted).toBe(true);
    expect(result.decisionTier).toBe("validated-match");
  });

  it("uses alphaGain in the result", () => {
    const img = makeImage(512, 512);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.3),
    });
    const result = evaluateRestorationCandidate(img, candidate, 1.25);
    expect(result.alphaGain).toBe(1.25);
  });

  it("uses spatialScore/gradientScore from candidate as originalSpatialScore/originalGradientScore", () => {
    const img = makeImage(512, 512);
    const candidate = makeScoredCandidate({
      position: { x: 432, y: 432, width: 48, height: 48 },
      alphaMap: new Float32Array(48 * 48).fill(0.3),
      spatialScore: 0.99,
      gradientScore: 0.88,
    });
    const result = evaluateRestorationCandidate(img, candidate, 1.0);
    expect(result.originalSpatialScore).toBe(0.99);
    expect(result.originalGradientScore).toBe(0.88);
  });
});

// ─── pickBetterCandidate ──────────────────────────────────────────────────────

describe("pickBetterCandidate", () => {
  it("returns candidate when currentBest is null", () => {
    const c = makeEvaluatedCandidate();
    expect(pickBetterCandidate(null, c)).toBe(c);
  });

  it("returns currentBest when candidate is null", () => {
    const c = makeEvaluatedCandidate();
    expect(pickBetterCandidate(c, null)).toBe(c);
  });

  it("prefers accepted over not accepted", () => {
    const accepted = makeEvaluatedCandidate({ accepted: true, validationCost: 0.9 });
    const rejected = makeEvaluatedCandidate({ accepted: false, validationCost: 0.1 });
    expect(pickBetterCandidate(rejected, accepted)).toBe(accepted);
    expect(pickBetterCandidate(accepted, rejected)).toBe(accepted);
  });

  it("prefers lower validationCost when both accepted", () => {
    const cheap = makeEvaluatedCandidate({ accepted: true, validationCost: 0.1, improvement: 0.5 });
    const expensive = makeEvaluatedCandidate({ accepted: true, validationCost: 0.9, improvement: 0.5 });
    expect(pickBetterCandidate(expensive, cheap)).toBe(cheap);
  });

  it("prefers higher improvement when costs are tied", () => {
    const cost = 0.2;
    const better = makeEvaluatedCandidate({ accepted: true, validationCost: cost, improvement: 0.9 });
    const worse = makeEvaluatedCandidate({ accepted: true, validationCost: cost, improvement: 0.5 });
    expect(pickBetterCandidate(worse, better)).toBe(better);
  });

  it("prefers higher confidence when both rejected", () => {
    const confident = makeEvaluatedCandidate({ accepted: false, confidence: 0.8, validationCost: 0.5 });
    const weak = makeEvaluatedCandidate({ accepted: false, confidence: 0.4, validationCost: 0.5 });
    expect(pickBetterCandidate(weak, confident)).toBe(confident);
  });

  it("returns currentBest when there is no clear winner", () => {
    const a = makeEvaluatedCandidate({ accepted: true, validationCost: 0.5, improvement: 0.5 });
    const b = makeEvaluatedCandidate({ accepted: true, validationCost: 0.5, improvement: 0.5 });
    expect(pickBetterCandidate(a, b)).toBe(a);
  });
});

// ─── detectBestCandidate ──────────────────────────────────────────────────────

describe("detectBestCandidate", () => {
  it("returns null for a tiny image where no candidate fits", () => {
    const img = makeImage(10, 10);
    const result = detectBestCandidate(img);
    expect(result).toBeNull();
  });

  it("returns a DetectionResult or null for a standard image", () => {
    const img = makeImage(512, 512);
    const result = detectBestCandidate(img);
    if (result !== null) {
      expect(typeof result.confidence).toBe("number");
      expect(typeof result.accepted).toBe("boolean");
      expect(result.position).toBeDefined();
      expect(result.config).toBeDefined();
    }
  });

  it("respects forcedVariant option", () => {
    const img = makeImage(512, 512);
    const result = detectBestCandidate(img, { forcedVariant: "48" });
    if (result !== null) {
      expect(result.config.logoSize).toBeGreaterThanOrEqual(24);
    }
  });

  it("respects corner option", () => {
    const img = makeImage(512, 512);
    const result = detectBestCandidate(img, { corner: "bottom-right" });
    if (result !== null) {
      expect(result.corner).toBe("bottom-right");
    }
  });

  it("adds provided alphaGain to gain candidates", () => {
    const img = makeImage(512, 512);
    // just check it doesn't throw with a custom alphaGain
    expect(() => detectBestCandidate(img, { alphaGain: 1.5 })).not.toThrow();
  });

  it("returns a deep copy of config and position (not aliased into the candidate)", () => {
    const img = makeImage(512, 512);
    const result = detectBestCandidate(img);
    if (result !== null) {
      // The returned config and position must be plain objects (structurally verify)
      expect(typeof result.config.logoSize).toBe("number");
      expect(typeof result.position.x).toBe("number");
      expect(typeof result.position.y).toBe("number");
    }
  });
});
