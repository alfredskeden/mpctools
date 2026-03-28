import { describe, it, expect } from "vitest";
import {
  dilateBinary,
  buildWeightedMaskData,
  buildVisibilityMaskData,
  buildCorrectionMaskData,
  runPipeline,
  type RemovalSettings,
  type PipelineResult,
} from "@/lib/watermark-removal";
import type { RawImageData } from "@/lib/watermark-math";
import type { DetectionResult } from "@/lib/watermark-detection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeImage(
  width: number,
  height: number,
  fill: (i: number) => [number, number, number, number] = () => [
    128, 128, 128, 255,
  ],
): RawImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const [r, g, b, a] = fill(i);
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { data, width, height };
}

function makeRect(
  x = 0,
  y = 0,
  width = 4,
  height = 4,
): { x: number; y: number; width: number; height: number } {
  return { x, y, width, height };
}

function makeAlphaMap(size: number, value = 0.5): Float32Array {
  return new Float32Array(size * size).fill(value);
}

function makeDetection(
  overrides: Partial<DetectionResult> = {},
): DetectionResult {
  const size = 4;
  const base: DetectionResult = {
    accepted: true,
    decisionTier: "direct-match",
    corner: "bottom-right",
    position: { x: 0, y: 0, width: size, height: size },
    config: {
      logoSize: size,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginTop: 0,
    },
    alphaGain: 1.0,
    confidence: 0.9,
    alphaMap: new Float32Array(size * size).fill(0),
    warp: { dx: 0, dy: 0, scale: 1 },
    source: "test",
    adjustedScore: 0.9,
    spatialScore: 0.9,
    gradientScore: 0.5,
    varianceScore: 0.5,
    imageData: makeImage(size, size),
    originalSpatialScore: 0.9,
    originalGradientScore: 0.5,
    processedSpatialScore: 0.1,
    processedGradientScore: 0.3,
    improvement: 0.8,
    nearBlackRatio: 0.01,
    nearBlackIncrease: 0.0,
    gradientIncrease: 0.0,
    validationCost: 0.1,
  };
  return { ...base, ...overrides };
}

// ─── dilateBinary ─────────────────────────────────────────────────────────────

describe("dilateBinary", () => {
  it("returns a copy when radius is 0", () => {
    // Given
    const source = new Uint8Array([1, 0, 0, 1]);

    // When
    const result = dilateBinary(source, 2, 2, 0);

    // Then
    expect(Array.from(result)).toEqual([1, 0, 0, 1]);
    expect(result).not.toBe(source);
  });

  it("returns a copy when radius is negative", () => {
    // Given
    const source = new Uint8Array([1, 0, 0, 0]);

    // When
    const result = dilateBinary(source, 2, 2, -1);

    // Then
    expect(Array.from(result)).toEqual([1, 0, 0, 0]);
  });

  it("dilates a single active pixel to neighbors", () => {
    // Given: 3×3 grid, center pixel active
    const source = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);

    // When: radius 1
    const result = dilateBinary(source, 3, 3, 1);

    // Then: all 9 pixels should be active
    expect(Array.from(result)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("does not dilate beyond boundary", () => {
    // Given: 3×3 grid, top-left pixel active
    const source = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0]);

    // When: radius 1
    const result = dilateBinary(source, 3, 3, 1);

    // Then: only top-left 2×2 should be active
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(1);
    expect(result[4]).toBe(1);
    expect(result[5]).toBe(0);
    expect(result[6]).toBe(0);
    expect(result[7]).toBe(0);
    expect(result[8]).toBe(0);
  });

  it("source with all zeros stays all zeros", () => {
    // Given
    const source = new Uint8Array(9);

    // When
    const result = dilateBinary(source, 3, 3, 2);

    // Then
    expect(result.every((v) => v === 0)).toBe(true);
  });

  it("preserves all-active source", () => {
    // Given
    const source = new Uint8Array(9).fill(1);

    // When
    const result = dilateBinary(source, 3, 3, 1);

    // Then
    expect(result.every((v) => v === 1)).toBe(true);
  });
});

// ─── buildWeightedMaskData ────────────────────────────────────────────────────

describe("buildWeightedMaskData", () => {
  it("returns RGBA buffer of full image size", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 0.5);

    // When
    const result = buildWeightedMaskData(rect, 8, 8, 0, alphaMap);

    // Then
    expect(result.length).toBe(8 * 8 * 4);
  });

  it("sets RGB channels to 255 where alpha > 0", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 0.5);

    // When
    const result = buildWeightedMaskData(rect, 4, 4, 0, alphaMap);

    // Then: check first pixel RGB
    expect(result[0]).toBe(255);
    expect(result[1]).toBe(255);
    expect(result[2]).toBe(255);
  });

  it("produces zero alpha for pixels below threshold", () => {
    // Given: alpha map with values 0.01, threshold 0.5
    const rect = makeRect(0, 0, 2, 2);
    const alphaMap = new Float32Array([0.01, 0.01, 0.01, 0.01]);

    // When
    const result = buildWeightedMaskData(rect, 2, 2, 0, alphaMap, {
      threshold: 0.5,
    });

    // Then: all alpha channels should be 0
    expect(result[3]).toBe(0);
    expect(result[7]).toBe(0);
  });

  it("produces non-zero alpha for pixels above threshold", () => {
    // Given
    const rect = makeRect(0, 0, 2, 2);
    const alphaMap = new Float32Array([0.8, 0.8, 0.8, 0.8]);

    // When
    const result = buildWeightedMaskData(rect, 2, 2, 0, alphaMap, {
      threshold: 0.5,
    });

    // Then: alpha should be > 0
    expect(result[3]).toBeGreaterThan(0);
  });

  it("applies gamma to weight computation", () => {
    // Given: same alpha map, different gamma values
    const rect = makeRect(0, 0, 1, 1);
    const alphaMap = new Float32Array([0.8]);

    // When
    const result1 = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      gamma: 1,
    });
    const result2 = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      gamma: 2,
    });

    // Then: higher gamma → lower alpha (for values < 1)
    expect(result1[3]).toBeGreaterThan(result2[3]);
  });

  it("applies opacityScale", () => {
    // Given
    const rect = makeRect(0, 0, 1, 1);
    const alphaMap = new Float32Array([1.0]);

    // When
    const full = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      opacityScale: 1,
    });
    const half = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      opacityScale: 0.5,
    });

    // Then
    expect(full[3]).toBe(255);
    expect(half[3]).toBe(128);
  });

  it("applies feather blur (non-zero passes reduce edge sharpness)", () => {
    // Given: 4×4 image, 2×2 active rect at corner with full alpha
    const rect = makeRect(0, 0, 2, 2);
    const alphaMap = new Float32Array([1, 1, 1, 1]);

    // When: blur vs no blur
    const noBlur = buildWeightedMaskData(rect, 4, 4, 0, alphaMap);
    const withBlur = buildWeightedMaskData(rect, 4, 4, 2, alphaMap);

    // Then: adjacent pixels outside rect should be influenced by blur
    const adjIdx = (1 * 4 + 2) * 4 + 3; // pixel (2,1) which is outside rect
    expect(noBlur[adjIdx]).toBe(0);
    expect(withBlur[adjIdx]).toBeGreaterThan(0);
  });

  it("clamps raw alpha values to [0, 1] range", () => {
    // Given: alpha map exceeding 1
    const rect = makeRect(0, 0, 1, 1);
    const alphaMap = new Float32Array([2.0]);

    // When
    const result = buildWeightedMaskData(rect, 1, 1, 0, alphaMap);

    // Then: should still be 255 not overflow
    expect(result[3]).toBe(255);
  });

  it("uses gamma=1 when gamma option is 0 or negative", () => {
    // Given
    const rect = makeRect(0, 0, 1, 1);
    const alphaMap = new Float32Array([0.5]);

    // When: gamma=0 should fall back to 1
    const result = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      gamma: 0,
    });
    const expected = buildWeightedMaskData(rect, 1, 1, 0, alphaMap, {
      gamma: 1,
    });

    // Then
    expect(result[3]).toBe(expected[3]);
  });

  it("positions pixels at correct offset in larger image", () => {
    // Given: 1×1 rect at (3, 3) in a 4×4 image
    const rect = makeRect(3, 3, 1, 1);
    const alphaMap = new Float32Array([1.0]);

    // When
    const result = buildWeightedMaskData(rect, 4, 4, 0, alphaMap);

    // Then: only pixel (3,3) should be active
    expect(result[(3 * 4 + 3) * 4 + 3]).toBe(255);
    expect(result[3]).toBe(0); // pixel (0,0) should be zero
  });
});

// ─── buildVisibilityMaskData ──────────────────────────────────────────────────

describe("buildVisibilityMaskData", () => {
  it("returns RGBA buffer of full image size", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 0.1);

    // When
    const result = buildVisibilityMaskData(rect, 8, 8, alphaMap);

    // Then
    expect(result.length).toBe(8 * 8 * 4);
  });

  it("produces zero buffer for all-zero alpha map", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = new Float32Array(16).fill(0);

    // When
    const result = buildVisibilityMaskData(rect, 4, 4, alphaMap, {
      feather: 0,
      maskExpand: 0,
    });

    // Then: no active pixels
    const anyAlpha = Array.from(result).filter((_, i) => i % 4 === 3);
    expect(anyAlpha.every((v) => v === 0)).toBe(true);
  });

  it("sets core pixels to fully opaque after blur", () => {
    // Given: alpha map with high values (above coreThreshold ~0.09 for defaults)
    const rect = makeRect(0, 0, 3, 3);
    const alphaMap = new Float32Array(9).fill(0.5);

    // When
    const result = buildVisibilityMaskData(rect, 3, 3, alphaMap, {
      feather: 0,
      maskExpand: 0,
      edgeReveal: 0.92,
      innerPunch: 1.02,
    });

    // Then: center pixel should be fully opaque (it's above coreThreshold)
    const centerAlpha = result[(1 * 3 + 1) * 4 + 3];
    expect(centerAlpha).toBe(255);
  });

  it("uses default edgeReveal and innerPunch when not provided", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 0.5);

    // When: no opts (defaults apply)
    const result = buildVisibilityMaskData(rect, 4, 4, alphaMap);

    // Then: should produce non-empty output
    const alphas = Array.from(result).filter((_, i) => i % 4 === 3);
    expect(alphas.some((v) => v > 0)).toBe(true);
  });

  it("expands edge mask when edgeReveal > 1", () => {
    // Given: tiny alpha spot
    const rect = makeRect(0, 0, 5, 5);
    const alphaMap = new Float32Array(25).fill(0);
    alphaMap[12] = 0.5; // only center pixel active

    // When: standard vs high edgeReveal
    const standard = buildVisibilityMaskData(rect, 5, 5, alphaMap, {
      feather: 0,
      edgeReveal: 0.92,
      maskExpand: 0,
    });
    const expanded = buildVisibilityMaskData(rect, 5, 5, alphaMap, {
      feather: 0,
      edgeReveal: 1.5,
      maskExpand: 0,
    });

    // Then: expanded should have more active pixels
    const countActive = (d: Uint8ClampedArray) =>
      Array.from(d)
        .filter((_, i) => i % 4 === 3)
        .filter((v) => v > 0).length;
    expect(countActive(expanded)).toBeGreaterThanOrEqual(countActive(standard));
  });

  it("expands core mask when innerPunch > 1", () => {
    // Given: spot with moderate alpha
    const rect = makeRect(0, 0, 5, 5);
    const alphaMap = new Float32Array(25).fill(0);
    alphaMap[12] = 0.15; // above coreThreshold for default innerPunch

    // When
    const standard = buildVisibilityMaskData(rect, 5, 5, alphaMap, {
      feather: 0,
      innerPunch: 1.0,
      maskExpand: 0,
    });
    const punched = buildVisibilityMaskData(rect, 5, 5, alphaMap, {
      feather: 0,
      innerPunch: 1.5,
      maskExpand: 0,
    });

    // Then: punched should have >= active pixels
    const countActive = (d: Uint8ClampedArray) =>
      Array.from(d)
        .filter((_, i) => i % 4 === 3)
        .filter((v) => v > 0).length;
    expect(countActive(punched)).toBeGreaterThanOrEqual(
      countActive(standard),
    );
  });

  it("feather smooths edges (adjacent pixels are non-zero)", () => {
    // Given: single pixel active at (2,2)
    const rect = makeRect(0, 0, 5, 5);
    const alphaMap = new Float32Array(25).fill(0);
    alphaMap[12] = 0.5;

    // When
    const result = buildVisibilityMaskData(rect, 5, 5, alphaMap, {
      feather: 3,
      maskExpand: 0,
    });

    // Then: pixels adjacent to center should have non-zero alpha
    const above = result[(1 * 5 + 2) * 4 + 3];
    const below = result[(3 * 5 + 2) * 4 + 3];
    expect(above + below).toBeGreaterThan(0);
  });

  it("maskExpand=0 and edgeReveal=0 uses minimum expand", () => {
    // Given: all-zero alpha map
    const rect = makeRect(0, 0, 3, 3);
    const alphaMap = new Float32Array(9).fill(0);

    // When
    const result = buildVisibilityMaskData(rect, 3, 3, alphaMap, {
      feather: 0,
      maskExpand: 0,
      edgeReveal: 0,
      innerPunch: 0,
    });

    // Then: all pixels should be zero alpha
    const alphas = Array.from(result).filter((_, i) => i % 4 === 3);
    expect(alphas.every((v) => v === 0)).toBe(true);
  });
});

// ─── buildCorrectionMaskData ──────────────────────────────────────────────────

describe("buildCorrectionMaskData", () => {
  it("returns RGBA buffer of full image size", () => {
    // Given
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 0.5);

    // When
    const result = buildCorrectionMaskData(rect, 8, 8, 0, alphaMap);

    // Then
    expect(result.length).toBe(8 * 8 * 4);
  });

  it("uses GEMINI_CORRECTION_THRESHOLD (0.015): alpha values below are zeroed", () => {
    // Given: all pixels at 0.01 (below 0.015)
    const rect = makeRect(0, 0, 2, 2);
    const alphaMap = new Float32Array([0.01, 0.01, 0.01, 0.01]);

    // When
    const result = buildCorrectionMaskData(rect, 2, 2, 0, alphaMap);

    // Then: all alpha zero
    expect(result[3]).toBe(0);
    expect(result[7]).toBe(0);
  });

  it("produces non-zero alpha for pixels above correction threshold", () => {
    // Given: all pixels at 0.5 (above 0.015)
    const rect = makeRect(0, 0, 2, 2);
    const alphaMap = new Float32Array([0.5, 0.5, 0.5, 0.5]);

    // When
    const result = buildCorrectionMaskData(rect, 2, 2, 0, alphaMap);

    // Then
    expect(result[3]).toBeGreaterThan(0);
  });

  it("delegates feather to buildWeightedMaskData", () => {
    // Given: 4×4 active rect at (0,0) with full alpha
    const rect = makeRect(0, 0, 4, 4);
    const alphaMap = makeAlphaMap(4, 1.0);

    // When
    const noBlur = buildCorrectionMaskData(rect, 6, 6, 0, alphaMap);
    const withBlur = buildCorrectionMaskData(rect, 6, 6, 2, alphaMap);

    // Then: pixels outside rect are influenced by blur
    const adjIdx = (0 * 6 + 4) * 4 + 3; // pixel (4,0), just outside rect
    expect(noBlur[adjIdx]).toBe(0);
    expect(withBlur[adjIdx]).toBeGreaterThan(0);
  });
});

// ─── runPipeline ──────────────────────────────────────────────────────────────

describe("runPipeline", () => {
  it("returns a PipelineResult with expected shape", () => {
    // Given
    const img = makeImage(128, 128);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings);

    // Then
    expect(typeof result.alphaGain).toBe("number");
    expect(typeof result.confidence).toBe("number");
    expect(typeof result.accepted).toBe("boolean");
    expect(["adaptive", "preset"]).toContain(result.detectionSource);
    expect(result.imageData.width).toBe(128);
    expect(result.imageData.height).toBe(128);
    expect(result.alphaMap).toBeInstanceOf(Float32Array);
  });

  it("uses preset detection when no detection is provided", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings);

    // Then
    expect(result.detectionSource).toBe("preset");
    expect(result.accepted).toBe(false);
    expect(result.confidence).toBe(0.74);
  });

  it("uses adaptive detection when accepted detection is provided", () => {
    // Given
    const img = makeImage(8, 8);
    const detection = makeDetection({
      accepted: true,
      confidence: 0.95,
      alphaGain: 1.2,
      position: { x: 0, y: 0, width: 4, height: 4 },
      alphaMap: new Float32Array(16).fill(0),
    });
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, detection);

    // Then
    expect(result.detectionSource).toBe("adaptive");
    expect(result.accepted).toBe(true);
    expect(result.confidence).toBe(0.95);
    expect(result.alphaGain).toBe(1.2);
  });

  it("falls back to preset when detection is not accepted", () => {
    // Given
    const img = makeImage(64, 64);
    const detection = makeDetection({ accepted: false });
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, detection);

    // Then
    expect(result.detectionSource).toBe("preset");
    expect(result.accepted).toBe(false);
  });

  it("falls back to preset when detection is null", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, null);

    // Then
    expect(result.detectionSource).toBe("preset");
  });

  it("falls back to preset when detection is undefined", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, undefined);

    // Then
    expect(result.detectionSource).toBe("preset");
  });

  it("uses default alphaGain=1 when not provided or invalid", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = { alphaGain: -5 };

    // When
    const result = runPipeline(img, settings);

    // Then: default gain applied (1.0)
    expect(result.alphaGain).toBe(1.0);
  });

  it("uses provided alphaGain in preset mode when valid and positive", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = { alphaGain: 1.5 };

    // When
    const result = runPipeline(img, settings);

    // Then
    expect(result.alphaGain).toBe(1.5);
    expect(result.detectionSource).toBe("preset");
  });

  it("uses provided alphaGain when valid", () => {
    // Given
    const img = makeImage(8, 8);
    const detection = makeDetection({
      accepted: true,
      alphaGain: 1.3,
      alphaMap: new Float32Array(16).fill(0),
      position: { x: 0, y: 0, width: 4, height: 4 },
    });
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, detection);

    // Then
    expect(result.alphaGain).toBe(1.3);
  });

  it("applies postLightness when non-zero", () => {
    // Given: white image
    const img = makeImage(8, 8, () => [255, 255, 255, 255]);
    const detection = makeDetection({
      accepted: true,
      alphaMap: new Float32Array(16).fill(0.5),
      position: { x: 0, y: 0, width: 4, height: 4 },
    });
    const settingsLight: RemovalSettings = { postLightness: 10 };
    const settingsNone: RemovalSettings = { postLightness: 0 };

    // When
    const withLight = runPipeline(img, settingsLight, detection);
    const withNone = runPipeline(img, settingsNone, detection);

    // Then: both return valid results; postLightness path was exercised
    expect(withLight.imageData.width).toBe(8);
    expect(withNone.imageData.width).toBe(8);
  });

  it("uses bottom-right corner as default when corner is auto", () => {
    // Given
    const img = makeImage(512, 512);
    const settings: RemovalSettings = { corner: "auto" };

    // When
    const result = runPipeline(img, settings);

    // Then: position should be near bottom-right
    expect(result.position.x).toBeGreaterThan(img.width / 2);
    expect(result.position.y).toBeGreaterThan(img.height / 2);
  });

  it("uses specified corner when not auto", () => {
    // Given
    const img = makeImage(512, 512);
    const settingsBR: RemovalSettings = { corner: "bottom-right" };
    const settingsTL: RemovalSettings = { corner: "top-left" };

    // When
    const brResult = runPipeline(img, settingsBR);
    const tlResult = runPipeline(img, settingsTL);

    // Then: top-left position should have smaller x and y
    expect(tlResult.position.x).toBeLessThan(brResult.position.x);
    expect(tlResult.position.y).toBeLessThan(brResult.position.y);
  });

  it("uses default feather=4 when not provided", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = {};

    // When: no error thrown
    const result = runPipeline(img, settings);

    // Then
    expect(result.imageData).toBeDefined();
  });

  it("uses provided feather value", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = { feather: 0 };

    // When
    const result = runPipeline(img, settings);

    // Then
    expect(result.imageData).toBeDefined();
  });

  it("passes edgeReveal and innerPunch to visibility mask", () => {
    // Given
    const img = makeImage(64, 64);
    const settings: RemovalSettings = {
      edgeReveal: 1.5,
      innerPunch: 1.5,
      maskExpand: 3,
    };

    // When: no error thrown with extreme values
    const result = runPipeline(img, settings);

    // Then
    expect(result.imageData.width).toBe(64);
  });

  it("returns position matching detection when detection is accepted", () => {
    // Given
    const img = makeImage(16, 16);
    const pos = { x: 2, y: 2, width: 4, height: 4 };
    const detection = makeDetection({
      accepted: true,
      position: pos,
      alphaMap: new Float32Array(16).fill(0),
    });
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings, detection);

    // Then
    expect(result.position).toEqual(pos);
  });

  it("output image has same dimensions as input", () => {
    // Given
    const img = makeImage(200, 150);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings);

    // Then
    expect(result.imageData.width).toBe(200);
    expect(result.imageData.height).toBe(150);
  });
});
