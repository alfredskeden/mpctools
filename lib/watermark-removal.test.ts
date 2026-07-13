import { describe, it, expect } from "vitest";
import {
  runPipeline,
  type RemovalSettings,
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

  it("applies the DIVIDE edge-cleanup pass on a 96px-tier image", () => {
    // Given: a 1k+ tier image whose preset logo size is 96px (the size the
    // embedded DIVIDE map is authored for).
    const img = makeImage(1024, 1024);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings);

    // Then: the anchored region is 96px and the pipeline produces flat output.
    expect(result.position.width).toBe(96);
    expect(result.imageData.width).toBe(1024);
    expect(result.imageData.height).toBe(1024);
  });

  it("returns the flat repaired image without mask compositing", () => {
    // Given: pixels far from the watermark region must be identical to the input
    // (no feathered blend touches them).
    const img = makeImage(512, 512, () => [40, 90, 160, 255]);
    const settings: RemovalSettings = {};

    // When
    const result = runPipeline(img, settings);

    // Then: top-left pixel (outside the bottom-right logo) is untouched.
    expect(result.imageData.data[0]).toBe(40);
    expect(result.imageData.data[1]).toBe(90);
    expect(result.imageData.data[2]).toBe(160);
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
