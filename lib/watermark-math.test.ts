import { describe, it, expect } from "vitest";
import {
  clamp,
  lerp,
  meanAndVariance,
  normalizedCrossCorrelation,
  toGrayscale,
  sobelMagnitude,
  getRegion,
  stdDevRegion,
  interpolateAlphaMap,
  warpAlphaMap,
  computeRegionSpatialCorrelation,
  computeRegionGradientCorrelation,
  removeWatermarkReverseAlpha,
  extractRegion,
  type RawImageData,
} from "@/lib/watermark-math";

// Helper: create a solid-color RawImageData
function makeImage(
  width: number,
  height: number,
  r = 128,
  g = 128,
  b = 128,
  a = 255,
): RawImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
  return { data, width, height };
}

describe("watermark-math", () => {
  describe("clamp", () => {
    it("clamps value above max to max", () => {
      expect(clamp(10, 0, 5)).toBe(5);
    });
    it("clamps value below min to min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });
    it("leaves value within range unchanged", () => {
      expect(clamp(3, 0, 10)).toBe(3);
    });
  });

  describe("lerp", () => {
    it("returns a at t=0", () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });
    it("returns b at t=1", () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });
    it("returns midpoint at t=0.5", () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe("meanAndVariance", () => {
    it("returns zeros for empty array", () => {
      const result = meanAndVariance(new Float32Array(0));
      expect(result.mean).toBe(0);
      expect(result.variance).toBe(0);
    });

    it("calculates correct mean for uniform array", () => {
      const result = meanAndVariance(new Float32Array([2, 2, 2, 2]));
      expect(result.mean).toBe(2);
      expect(result.variance).toBe(0);
    });

    it("calculates correct mean and variance for mixed values", () => {
      // [0, 2] → mean=1, variance=1
      const result = meanAndVariance(new Float32Array([0, 2]));
      expect(result.mean).toBe(1);
      expect(result.variance).toBe(1);
    });
  });

  describe("normalizedCrossCorrelation", () => {
    it("returns 0 for empty arrays", () => {
      expect(
        normalizedCrossCorrelation(new Float32Array(0), new Float32Array(0)),
      ).toBe(0);
    });

    it("returns 0 for mismatched lengths", () => {
      expect(
        normalizedCrossCorrelation(
          new Float32Array([1, 2]),
          new Float32Array([1]),
        ),
      ).toBe(0);
    });

    it("returns 1 for identical arrays", () => {
      const a = new Float32Array([0, 0.5, 1, 0.5]);
      expect(normalizedCrossCorrelation(a, new Float32Array(a))).toBeCloseTo(
        1,
        5,
      );
    });

    it("returns -1 for inverted arrays", () => {
      const a = new Float32Array([0, 1]);
      const b = new Float32Array([1, 0]);
      expect(normalizedCrossCorrelation(a, b)).toBeCloseTo(-1, 5);
    });

    it("returns 0 for constant arrays (no variance)", () => {
      const a = new Float32Array([1, 1, 1]);
      const b = new Float32Array([0, 0, 0]);
      expect(normalizedCrossCorrelation(a, b)).toBe(0);
    });
  });

  describe("toGrayscale", () => {
    it("converts white pixel to 1.0", () => {
      const img = makeImage(1, 1, 255, 255, 255);
      const gray = toGrayscale(img);
      expect(gray[0]).toBeCloseTo(1, 4);
    });

    it("converts black pixel to 0.0", () => {
      const img = makeImage(1, 1, 0, 0, 0);
      const gray = toGrayscale(img);
      expect(gray[0]).toBe(0);
    });

    it("uses Rec.709 weighting (pure red < pure green)", () => {
      const red = makeImage(1, 1, 255, 0, 0);
      const green = makeImage(1, 1, 0, 255, 0);
      expect(toGrayscale(red)[0]).toBeCloseTo(0.2126, 4);
      expect(toGrayscale(green)[0]).toBeCloseTo(0.7152, 4);
    });

    it("returns array of size width×height", () => {
      const img = makeImage(4, 3);
      expect(toGrayscale(img).length).toBe(12);
    });
  });

  describe("sobelMagnitude", () => {
    it("returns zero-gradient for uniform image", () => {
      const gray = new Float32Array(9).fill(0.5); // 3×3 uniform
      const result = sobelMagnitude(gray, 3, 3);
      // Border pixels are always 0; interior pixel (1,1) should also be 0
      for (const v of result) expect(v).toBe(0);
    });

    it("returns same size as input", () => {
      const gray = new Float32Array(16).fill(0);
      const result = sobelMagnitude(gray, 4, 4);
      expect(result.length).toBe(16);
    });

    it("detects a horizontal edge", () => {
      // 4×4: top half black, bottom half white
      const gray = new Float32Array(16);
      for (let i = 8; i < 16; i++) gray[i] = 1;
      const result = sobelMagnitude(gray, 4, 4);
      // Interior pixels on the edge boundary should have nonzero gradient
      const hasEdge = Array.from(result).some((v) => v > 0);
      expect(hasEdge).toBe(true);
    });
  });

  describe("getRegion", () => {
    it("extracts a 2×2 region from a 4×4 grid", () => {
      const data = new Float32Array(16);
      for (let i = 0; i < 16; i++) data[i] = i;
      // Extract 2×2 starting at (1,1) from a 4-wide grid
      // Row 1: indices 4,5,6,7 → cols 1,2 → values 5,6
      // Row 2: indices 8,9,10,11 → cols 1,2 → values 9,10
      const region = getRegion(data, 4, 1, 1, 2);
      expect(region[0]).toBe(5);
      expect(region[1]).toBe(6);
      expect(region[2]).toBe(9);
      expect(region[3]).toBe(10);
    });
  });

  describe("stdDevRegion", () => {
    it("returns 0 for uniform region", () => {
      const data = new Float32Array(16).fill(0.5);
      expect(stdDevRegion(data, 4, 0, 0, 4)).toBe(0);
    });

    it("returns correct std for two-value region", () => {
      // 2×2 region with values [0, 1, 0, 1] → mean=0.5, std=0.5
      const data = new Float32Array([0, 1, 0, 1]);
      const result = stdDevRegion(data, 2, 0, 0, 2);
      expect(result).toBeCloseTo(0.5, 5);
    });

    it("returns 0 for empty region", () => {
      expect(stdDevRegion(new Float32Array(0), 0, 0, 0, 0)).toBe(0);
    });
  });

  describe("interpolateAlphaMap", () => {
    it("returns empty array for targetSize 0", () => {
      const src = new Float32Array([1, 0, 0, 1]);
      expect(interpolateAlphaMap(src, 2, 0).length).toBe(0);
    });

    it("returns copy when source and target sizes match", () => {
      const src = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = interpolateAlphaMap(src, 2, 2);
      expect(result).not.toBe(src);
      // Float32 precision — compare approximately
      for (let i = 0; i < src.length; i++) {
        expect(result[i]).toBeCloseTo(src[i], 5);
      }
    });

    it("upscales a 2×2 map to 4×4 (corners preserved)", () => {
      const src = new Float32Array([0, 0, 0, 1]); // 2×2: top-left=0, bottom-right=1
      const result = interpolateAlphaMap(src, 2, 4);
      expect(result.length).toBe(16);
      expect(result[0]).toBeCloseTo(0, 5); // top-left corner
      expect(result[15]).toBeCloseTo(1, 5); // bottom-right corner
    });
  });

  describe("warpAlphaMap", () => {
    it("returns empty array for size 0", () => {
      expect(warpAlphaMap(new Float32Array(0), 0).length).toBe(0);
    });

    it("returns a copy when no warp applied (dx=dy=0, scale=1)", () => {
      const src = new Float32Array([1, 0, 0, 1]);
      const result = warpAlphaMap(src, 2);
      expect(result).not.toBe(src);
      expect(Array.from(result)).toEqual([1, 0, 0, 1]);
    });

    it("returns same size as input", () => {
      const src = new Float32Array(9);
      const result = warpAlphaMap(src, 3, { dx: 1 });
      expect(result.length).toBe(9);
    });
  });

  describe("computeRegionSpatialCorrelation", () => {
    it("returns 0 when region is out of bounds", () => {
      const img = makeImage(10, 10);
      const alphaMap = new Float32Array(100).fill(0.5);
      // x=9, size=5 → out of bounds
      expect(
        computeRegionSpatialCorrelation(img, alphaMap, { x: 9, y: 0, size: 5 }),
      ).toBe(0);
    });

    it("returns 0 for zero-size region", () => {
      const img = makeImage(10, 10);
      expect(
        computeRegionSpatialCorrelation(img, new Float32Array(0), {
          x: 0,
          y: 0,
          size: 0,
        }),
      ).toBe(0);
    });

    it("returns a finite value for valid region", () => {
      const img = makeImage(10, 10, 100, 150, 200);
      const alphaMap = new Float32Array(25).fill(0.3);
      const score = computeRegionSpatialCorrelation(img, alphaMap, {
        x: 0,
        y: 0,
        size: 5,
      });
      expect(Number.isFinite(score)).toBe(true);
    });
  });

  describe("computeRegionGradientCorrelation", () => {
    it("returns 0 when region size <= 2", () => {
      const img = makeImage(10, 10);
      const alphaMap = new Float32Array(4).fill(0.5);
      expect(
        computeRegionGradientCorrelation(img, alphaMap, { x: 0, y: 0, size: 2 }),
      ).toBe(0);
    });

    it("returns 0 when out of bounds", () => {
      const img = makeImage(5, 5);
      expect(
        computeRegionGradientCorrelation(img, new Float32Array(100), {
          x: 3,
          y: 3,
          size: 10,
        }),
      ).toBe(0);
    });

    it("returns a finite number for a valid region", () => {
      const img = makeImage(10, 10, 50, 100, 150);
      const alphaMap = new Float32Array(25).fill(0.4);
      const score = computeRegionGradientCorrelation(img, alphaMap, {
        x: 0,
        y: 0,
        size: 5,
      });
      expect(Number.isFinite(score)).toBe(true);
    });
  });

  describe("removeWatermarkReverseAlpha", () => {
    it("does not modify pixels where alphaMap is zero", () => {
      const img = makeImage(4, 4, 100, 100, 100);
      const originalData = new Uint8ClampedArray(img.data);
      const alphaMap = new Float32Array(16).fill(0); // all zero
      removeWatermarkReverseAlpha(img, alphaMap, { x: 0, y: 0, width: 4, height: 4 });
      expect(Array.from(img.data)).toEqual(Array.from(originalData));
    });

    it("modifies pixels where alphaMap has significant value", () => {
      // Use a high alpha so the pixel will definitely change
      const img = makeImage(2, 2, 200, 200, 200);
      const alphaMap = new Float32Array(4).fill(0.9);
      removeWatermarkReverseAlpha(img, alphaMap, {
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      });
      // After reverse-alpha with high alpha, values should shift
      expect(img.data[0]).not.toBe(200);
    });

    it("uses default alphaGain of 1 when not provided", () => {
      const img1 = makeImage(2, 2, 180, 180, 180);
      const img2 = makeImage(2, 2, 180, 180, 180);
      const alphaMap = new Float32Array(4).fill(0.5);
      removeWatermarkReverseAlpha(img1, alphaMap, {
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      });
      removeWatermarkReverseAlpha(img2, alphaMap, {
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      }, { alphaGain: 1 });
      expect(Array.from(img1.data)).toEqual(Array.from(img2.data));
    });

    it("keeps pixel values in [0, 255] range", () => {
      const img = makeImage(2, 2, 10, 10, 10); // dark pixel
      const alphaMap = new Float32Array(4).fill(0.95);
      removeWatermarkReverseAlpha(img, alphaMap, {
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      }, { alphaGain: 1.5 });
      for (let i = 0; i < img.data.length; i += 4) {
        expect(img.data[i]).toBeGreaterThanOrEqual(0);
        expect(img.data[i]).toBeLessThanOrEqual(255);
      }
    });

    it("brightens a pixel by the divide map even where alpha is zero", () => {
      const img = makeImage(2, 2, 100, 100, 100);
      const alphaMap = new Float32Array(4).fill(0); // gated out by threshold
      const divideMap = new Float32Array(4).fill(0.5);
      removeWatermarkReverseAlpha(
        img,
        alphaMap,
        { x: 0, y: 0, width: 2, height: 2 },
        { divideMap },
      );
      // 100 / 0.5 = 200
      expect(img.data[0]).toBe(200);
    });

    it("leaves a pixel unchanged where the divide map is 1", () => {
      const img = makeImage(2, 2, 120, 120, 120);
      const alphaMap = new Float32Array(4).fill(0);
      const divideMap = new Float32Array(4).fill(1);
      removeWatermarkReverseAlpha(
        img,
        alphaMap,
        { x: 0, y: 0, width: 2, height: 2 },
        { divideMap },
      );
      expect(img.data[0]).toBe(120);
    });

    it("applies the divide step after reverse-alpha unblend", () => {
      const withDivide = makeImage(2, 2, 180, 180, 180);
      const withoutDivide = makeImage(2, 2, 180, 180, 180);
      const alphaMap = new Float32Array(4).fill(0.5);
      const divideMap = new Float32Array(4).fill(0.8);
      removeWatermarkReverseAlpha(withoutDivide, alphaMap, {
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      });
      removeWatermarkReverseAlpha(
        withDivide,
        alphaMap,
        { x: 0, y: 0, width: 2, height: 2 },
        { divideMap },
      );
      // reverse-alpha result: (180 - 0.5*255)/0.5 = 105; then /0.8 = 131
      expect(withoutDivide.data[0]).toBe(105);
      expect(withDivide.data[0]).toBe(131);
    });

    it("clamps divide-brightened values to 255", () => {
      const img = makeImage(1, 1, 200, 200, 200);
      const alphaMap = new Float32Array(1).fill(0);
      const divideMap = new Float32Array(1).fill(0.5); // 200/0.5 = 400
      removeWatermarkReverseAlpha(
        img,
        alphaMap,
        { x: 0, y: 0, width: 1, height: 1 },
        { divideMap },
      );
      expect(img.data[0]).toBe(255);
    });
  });

  describe("extractRegion", () => {
    it("returns a RawImageData with the region dimensions", () => {
      // Given
      const img = makeImage(10, 10);

      // When
      const region = extractRegion(img, { x: 2, y: 3, width: 4, height: 5 });

      // Then
      expect(region.width).toBe(4);
      expect(region.height).toBe(5);
      expect(region.data.length).toBe(4 * 5 * 4);
    });

    it("copies the correct pixel values from the source image", () => {
      // Given: 4×4 image where each pixel's R channel equals its row index
      const img: RawImageData = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray(
          Array.from({ length: 64 }, (_, i) => {
            const pixel = Math.floor(i / 4);
            const row = Math.floor(pixel / 4);
            return i % 4 === 0 ? row * 10 : 255;
          }),
        ),
      };

      // When: extract a 2×2 region at (1, 2)
      const region = extractRegion(img, { x: 1, y: 2, width: 2, height: 2 });

      // Then: R channel of first pixel should equal row 2 = 20
      expect(region.data[0]).toBe(20);
      // R channel of second row should equal row 3 = 30
      expect(region.data[2 * 4]).toBe(30);
    });

    it("does not mutate the source image", () => {
      // Given
      const img = makeImage(8, 8, 100, 100, 100);
      const originalSlice = Array.from(img.data.slice(0, 16));

      // When
      extractRegion(img, { x: 0, y: 0, width: 4, height: 4 });

      // Then
      expect(Array.from(img.data.slice(0, 16))).toEqual(originalSlice);
    });

    it("handles a region at the image boundary", () => {
      // Given
      const img = makeImage(6, 6, 200, 150, 100);

      // When
      const region = extractRegion(img, { x: 4, y: 4, width: 2, height: 2 });

      // Then: all pixels should have the same color as the source
      expect(region.data[0]).toBe(200);
      expect(region.data[1]).toBe(150);
      expect(region.data[2]).toBe(100);
    });
  });
});
