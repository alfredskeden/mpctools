import { sharpenPixelData, analyzeGuideData } from "./image-processing";

describe("sharpenPixelData", () => {
  it("returns a Uint8ClampedArray of the same length", () => {
    const pixels = new Uint8ClampedArray([100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255]);
    const result = sharpenPixelData(pixels, 2, 2, 1, 1);

    expect(result).toBeInstanceOf(Uint8ClampedArray);
    expect(result.length).toBe(pixels.length);
  });

  it("preserves alpha channel", () => {
    const pixels = new Uint8ClampedArray([100, 100, 100, 200, 100, 100, 100, 150, 100, 100, 100, 100, 100, 100, 100, 50]);
    const result = sharpenPixelData(pixels, 2, 2, 1, 1);

    // Alpha values should be unchanged
    expect(result[3]).toBe(200);
    expect(result[7]).toBe(150);
    expect(result[11]).toBe(100);
    expect(result[15]).toBe(50);
  });

  it("clamps values to 0-255 range", () => {
    // High amount should push values but clamp
    const pixels = new Uint8ClampedArray([250, 0, 128, 255, 200, 50, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]);
    const result = sharpenPixelData(pixels, 2, 2, 10, 1);

    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
    }
  });

  it("returns identical data when amount is 0", () => {
    const pixels = new Uint8ClampedArray([100, 150, 200, 255, 50, 75, 100, 255, 200, 100, 50, 255, 25, 175, 225, 255]);
    const result = sharpenPixelData(pixels, 2, 2, 0, 1);

    for (let i = 0; i < pixels.length; i++) {
      expect(result[i]).toBe(pixels[i]);
    }
  });
});

describe("analyzeGuideData", () => {
  function makeGrayPixels(width: number, height: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
    return data;
  }

  it("returns null when all pixels are gray", () => {
    const data = makeGrayPixels(10, 10);

    expect(analyzeGuideData(data, 10, 10, 100, 100)).toBeNull();
  });

  it("detects non-gray pixels and returns bounding box analysis", () => {
    const width = 10;
    const height = 10;
    const data = makeGrayPixels(width, height);

    // Place a bright pixel at (3, 3)
    const idx = (3 * width + 3) * 4;
    data[idx] = 255;
    data[idx + 1] = 255;
    data[idx + 2] = 255;

    // Place a bright pixel at (6, 6)
    const idx2 = (6 * width + 6) * 4;
    data[idx2] = 255;
    data[idx2 + 1] = 255;
    data[idx2 + 2] = 255;

    const result = analyzeGuideData(data, width, height, 100, 100);
    expect(result).not.toBeNull();
    expect(result!.canvasW).toBeGreaterThan(0);
    expect(result!.canvasH).toBeGreaterThan(0);
  });

  it("computes correct canvas dimensions from bounding box", () => {
    const width = 100;
    const height = 100;
    const data = makeGrayPixels(width, height);

    // Non-gray region from (25,25) to (74,74) — 50x50 bbox
    for (let y = 25; y <= 74; y++) {
      for (let x = 25; x <= 74; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }

    const ogWidth = 200;
    const ogHeight = 200;
    const result = analyzeGuideData(data, width, height, ogWidth, ogHeight);

    expect(result).not.toBeNull();
    // bboxW = 50, canvasW = 200 * (100/50) = 400
    expect(result!.canvasW).toBe(400);
    expect(result!.canvasH).toBe(400);
    // ogX = (25/100) * 400 = 100
    expect(result!.ogX).toBe(100);
    expect(result!.ogY).toBe(100);
  });

  it("handles single non-gray pixel", () => {
    const width = 10;
    const height = 10;
    const data = makeGrayPixels(width, height);

    const idx = (5 * width + 5) * 4;
    data[idx] = 200; // clearly above threshold

    const result = analyzeGuideData(data, width, height, 100, 100);
    expect(result).not.toBeNull();
    // bboxW=1, bboxH=1, canvasW = 100 * (10/1) = 1000
    expect(result!.canvasW).toBe(1000);
    expect(result!.canvasH).toBe(1000);
  });
});
