import { describe, it, expect, beforeEach } from "vitest";
import {
  decodeGeminiBase64,
  getEmbeddedGeminiAlphaMap,
  getEmbeddedGeminiDivideMap,
} from "@/lib/watermark-alpha-maps";

describe("watermark-alpha-maps", () => {
  describe("decodeGeminiBase64", () => {
    it("decodes a known base64 string to correct bytes", () => {
      // "AAAA" in base64 = 3 zero bytes
      const result = decodeGeminiBase64("AAAA");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
    });

    it("decodes a known value correctly", () => {
      // base64 of [0x00, 0xFF, 0x80]
      const result = decodeGeminiBase64("AP+A");
      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0xff);
      expect(result[2]).toBe(0x80);
    });
  });

  describe("getEmbeddedGeminiAlphaMap", () => {
    it("returns a Float32Array for size 48", () => {
      const map = getEmbeddedGeminiAlphaMap(48);
      expect(map).toBeInstanceOf(Float32Array);
    });

    it("returns 48×48 = 2304 values for size 48", () => {
      const map = getEmbeddedGeminiAlphaMap(48);
      expect(map!.length).toBe(2304);
    });

    it("returns a Float32Array for size 96", () => {
      const map = getEmbeddedGeminiAlphaMap(96);
      expect(map).toBeInstanceOf(Float32Array);
    });

    it("returns 96×96 = 9216 values for size 96", () => {
      const map = getEmbeddedGeminiAlphaMap(96);
      expect(map!.length).toBe(9216);
    });

    it("all values in the 48px map are in range [0, 1]", () => {
      const map = getEmbeddedGeminiAlphaMap(48)!;
      for (let i = 0; i < map.length; i++) {
        expect(map[i]).toBeGreaterThanOrEqual(0);
        expect(map[i]).toBeLessThanOrEqual(1);
      }
    });

    it("all values in the 96px map are in range [0, 1]", () => {
      const map = getEmbeddedGeminiAlphaMap(96)!;
      for (let i = 0; i < map.length; i++) {
        expect(map[i]).toBeGreaterThanOrEqual(0);
        expect(map[i]).toBeLessThanOrEqual(1);
      }
    });

    it("returns a fresh copy each call (not the same reference)", () => {
      const a = getEmbeddedGeminiAlphaMap(48)!;
      const b = getEmbeddedGeminiAlphaMap(48)!;
      expect(a).not.toBe(b);
    });

    it("the 48px map has non-zero values (is not empty)", () => {
      const map = getEmbeddedGeminiAlphaMap(48)!;
      const hasNonZero = Array.from(map).some((v) => v > 0);
      expect(hasNonZero).toBe(true);
    });

    it("the 96px map has non-zero values (is not empty)", () => {
      const map = getEmbeddedGeminiAlphaMap(96)!;
      const hasNonZero = Array.from(map).some((v) => v > 0);
      expect(hasNonZero).toBe(true);
    });
  });

  describe("getEmbeddedGeminiDivideMap", () => {
    it("returns a Float32Array for size 96", () => {
      const map = getEmbeddedGeminiDivideMap(96);
      expect(map).toBeInstanceOf(Float32Array);
    });

    it("returns 96×96 = 9216 values for size 96", () => {
      const map = getEmbeddedGeminiDivideMap(96);
      expect(map!.length).toBe(9216);
    });

    it("all values are in range (0, 1]", () => {
      const map = getEmbeddedGeminiDivideMap(96)!;
      for (let i = 0; i < map.length; i++) {
        expect(map[i]).toBeGreaterThan(0);
        expect(map[i]).toBeLessThanOrEqual(1);
      }
    });

    it("contains edge-correction values below 1 (not a no-op map)", () => {
      const map = getEmbeddedGeminiDivideMap(96)!;
      const hasBelowOne = Array.from(map).some((v) => v < 1);
      expect(hasBelowOne).toBe(true);
    });

    it("returns a fresh copy each call (not the same reference)", () => {
      const a = getEmbeddedGeminiDivideMap(96)!;
      const b = getEmbeddedGeminiDivideMap(96)!;
      expect(a).not.toBe(b);
    });

    it("returns null for an unsupported size", () => {
      expect(getEmbeddedGeminiDivideMap(48 as 96)).toBeNull();
    });
  });
});
