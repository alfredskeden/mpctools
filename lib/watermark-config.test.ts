import { describe, it, expect } from "vitest";
import {
  HISTORY_LIMIT,
  CHECKER_SIZE,
  EXPORT_MIME,
  GEMINI_PRESETS,
  GEMINI_OFFICIAL_SIZES,
  GEMINI_CONFIG_BY_TIER,
  GEMINI_DETECTION,
  GEMINI_ALPHA_NOISE_FLOOR,
  GEMINI_ALPHA_THRESHOLD,
  GEMINI_MAX_ALPHA,
  GEMINI_LOGO_VALUE,
} from "@/lib/watermark-config";

describe("watermark-config", () => {
  describe("HISTORY_LIMIT", () => {
    it("is 30", () => {
      expect(HISTORY_LIMIT).toBe(30);
    });
  });

  describe("CHECKER_SIZE", () => {
    it("is 24", () => {
      expect(CHECKER_SIZE).toBe(24);
    });
  });

  describe("EXPORT_MIME", () => {
    it("is image/png", () => {
      expect(EXPORT_MIME).toBe("image/png");
    });
  });

  describe("GEMINI_PRESETS", () => {
    it("has auto, 48, and 96 presets", () => {
      expect(Object.keys(GEMINI_PRESETS)).toEqual(
        expect.arrayContaining(["auto", "48", "96"]),
      );
    });

    it("auto preset has no size config", () => {
      expect(GEMINI_PRESETS["auto"].logoSize).toBeUndefined();
    });

    it("48 preset has logoSize 48 and margins 96", () => {
      const p = GEMINI_PRESETS["48"];
      expect(p.logoSize).toBe(48);
      expect(p.marginRight).toBe(96);
      expect(p.marginBottom).toBe(96);
      expect(p.marginLeft).toBe(96);
      expect(p.marginTop).toBe(96);
    });

    it("96 preset has logoSize 96 and margins 192", () => {
      const p = GEMINI_PRESETS["96"];
      expect(p.logoSize).toBe(96);
      expect(p.marginRight).toBe(192);
      expect(p.marginBottom).toBe(192);
    });
  });

  describe("GEMINI_OFFICIAL_SIZES", () => {
    it("contains at least one entry per tier", () => {
      const tiers = new Set(GEMINI_OFFICIAL_SIZES.map((s) => s.tier));
      expect(tiers.has("0.5k")).toBe(true);
      expect(tiers.has("1k")).toBe(true);
      expect(tiers.has("2k")).toBe(true);
      expect(tiers.has("4k")).toBe(true);
    });

    it("every entry has positive width and height", () => {
      for (const s of GEMINI_OFFICIAL_SIZES) {
        expect(s.width).toBeGreaterThan(0);
        expect(s.height).toBeGreaterThan(0);
      }
    });

    it("includes the canonical 1k square size", () => {
      const found = GEMINI_OFFICIAL_SIZES.find(
        (s) => s.width === 1024 && s.height === 1024,
      );
      expect(found).toBeDefined();
      expect(found?.tier).toBe("1k");
    });
  });

  describe("GEMINI_CONFIG_BY_TIER", () => {
    it("0.5k tier uses 48px logo", () => {
      expect(GEMINI_CONFIG_BY_TIER["0.5k"].logoSize).toBe(48);
    });

    it("1k, 2k, 4k tiers use 96px logo", () => {
      expect(GEMINI_CONFIG_BY_TIER["1k"].logoSize).toBe(96);
      expect(GEMINI_CONFIG_BY_TIER["2k"].logoSize).toBe(96);
      expect(GEMINI_CONFIG_BY_TIER["4k"].logoSize).toBe(96);
    });

    it("all tiers have all four margin properties", () => {
      for (const config of Object.values(GEMINI_CONFIG_BY_TIER)) {
        expect(typeof config.marginRight).toBe("number");
        expect(typeof config.marginBottom).toBe("number");
        expect(typeof config.marginLeft).toBe("number");
        expect(typeof config.marginTop).toBe("number");
      }
    });
  });

  describe("alpha blending constants", () => {
    it("GEMINI_ALPHA_NOISE_FLOOR is 3/255", () => {
      expect(GEMINI_ALPHA_NOISE_FLOOR).toBeCloseTo(3 / 255);
    });

    it("GEMINI_ALPHA_THRESHOLD is positive and small", () => {
      expect(GEMINI_ALPHA_THRESHOLD).toBeGreaterThan(0);
      expect(GEMINI_ALPHA_THRESHOLD).toBeLessThan(0.01);
    });

    it("GEMINI_MAX_ALPHA is less than 1", () => {
      expect(GEMINI_MAX_ALPHA).toBeLessThan(1);
      expect(GEMINI_MAX_ALPHA).toBeGreaterThan(0.9);
    });

    it("GEMINI_LOGO_VALUE is 255", () => {
      expect(GEMINI_LOGO_VALUE).toBe(255);
    });
  });

  describe("GEMINI_DETECTION", () => {
    it("has expected search offsets array", () => {
      expect(GEMINI_DETECTION.searchOffsets).toEqual([
        -24, -16, -12, -8, -4, 0, 4, 8, 12, 16, 24,
      ]);
    });

    it("has alphaGainCandidates including 1.0", () => {
      expect(GEMINI_DETECTION.alphaGainCandidates).toContain(1);
    });

    it("has positive confidence threshold", () => {
      expect(GEMINI_DETECTION.adaptiveConfidenceThreshold).toBeGreaterThan(0);
    });

    it("minLogoSize is less than maxLogoSize", () => {
      expect(GEMINI_DETECTION.minLogoSize).toBeLessThan(
        GEMINI_DETECTION.maxLogoSize,
      );
    });

    it("has templateShiftOffsets and templateScaleOffsets", () => {
      expect(GEMINI_DETECTION.templateShiftOffsets.length).toBeGreaterThan(0);
      expect(GEMINI_DETECTION.templateScaleOffsets.length).toBeGreaterThan(0);
    });
  });
});
