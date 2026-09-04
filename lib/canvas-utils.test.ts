import {
  calculateFitDimensions,
  calculateDrawParams,
  calculateInitialScale,
  clampPosition,
  MIN_VISIBLE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BG_COLOR,
  sharpenPixelData,
  applyUnsharpMask,
  applyUnsharpMaskAsync,
  detailPreservingResize,
  canvasSizeForStep,
  canvasSizeForDimension,
  canvasStepBounds,
  nearestCanvasStep,
  reduceRatio,
  MIN_CANVAS_WIDTH,
  MAX_CANVAS_WIDTH,
} from "./canvas-utils";

describe("calculateFitDimensions", () => {
  it("scales down a landscape image to fit container width", () => {
    const result = calculateFitDimensions(
      { width: 1000, height: 500 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 250 });
  });

  it("scales down a portrait image to fit container height", () => {
    const result = calculateFitDimensions(
      { width: 500, height: 1000 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 250, height: 500 });
  });

  it("scales up a small image to fit container", () => {
    const result = calculateFitDimensions(
      { width: 100, height: 50 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 250 });
  });

  it("returns exact container dimensions for matching aspect ratio", () => {
    const result = calculateFitDimensions(
      { width: 200, height: 200 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 500 });
  });

  it("handles container smaller than image", () => {
    const result = calculateFitDimensions(
      { width: 800, height: 600 },
      { width: 400, height: 300 },
    );

    expect(result).toEqual({ width: 400, height: 300 });
  });
});

describe("calculateDrawParams", () => {
  it("centers an image on the canvas at scale 1", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0 },
      1,
    );

    expect(result).toEqual({
      sx: 0,
      sy: 0,
      sw: 200,
      sh: 100,
      dx: 100,
      dy: 150,
      dw: 200,
      dh: 100,
    });
  });

  it("applies position offset", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 50, y: -30 },
      1,
    );

    expect(result.dx).toBe(150);
    expect(result.dy).toBe(120);
  });

  it("applies scale factor", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0 },
      2,
    );

    expect(result.dw).toBe(400);
    expect(result.dh).toBe(200);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(100);
  });
});

describe("CANVAS_WIDTH and CANVAS_HEIGHT", () => {
  it("exports canvas dimensions", () => {
    expect(CANVAS_WIDTH).toBe(3520);
    expect(CANVAS_HEIGHT).toBe(4800);
  });
});

describe("calculateInitialScale", () => {
  it("returns 1 for a small image that fits within the canvas", () => {
    const result = calculateInitialScale(
      { width: 100, height: 100 },
      { width: 744, height: 1039 },
    );

    expect(result).toBe(1);
  });

  it("scales down a large image to fit with 80% padding", () => {
    const result = calculateInitialScale(
      { width: 4000, height: 3000 },
      { width: 816, height: 1110 },
    );

    expect(result).toBe((816 * 0.8) / 4000);
  });

  it("scales based on height when image is taller relative to canvas", () => {
    const result = calculateInitialScale(
      { width: 100, height: 5000 },
      { width: 744, height: 1039 },
    );

    expect(result).toBe((1039 * 0.8) / 5000);
  });
});

describe("BG_COLOR", () => {
  it("exports the background color constant as gray", () => {
    // Given / When
    const color = BG_COLOR;

    // Then
    expect(color).toBe("#808080");
  });
});

describe("sharpenPixelData", () => {
  it("returns pixel data unchanged for a single pixel", () => {
    // Given
    const pixels = new Uint8ClampedArray([100, 150, 200, 255]);

    // When
    const result = sharpenPixelData(pixels, 1, 1, 0.5, 1);

    // Then
    expect(result).toEqual(new Uint8ClampedArray([100, 150, 200, 255]));
  });

  it("returns pixel data unchanged when amount is zero", () => {
    // Given — 2x2 image with varying pixels, but amount=0
    const pixels = new Uint8ClampedArray([
      10, 20, 30, 255, 200, 210, 220, 255, 50, 60, 70, 255, 150, 160, 170, 255,
    ]);

    // When
    const result = sharpenPixelData(pixels, 2, 2, 0, 1);

    // Then
    expect(result).toEqual(pixels);
  });

  it("returns uniform pixel data unchanged when all pixels are the same", () => {
    // Given — 2x2 image, all pixels identical
    const pixels = new Uint8ClampedArray([
      120, 80, 200, 255, 120, 80, 200, 255, 120, 80, 200, 255, 120, 80, 200,
      255,
    ]);

    // When
    const result = sharpenPixelData(pixels, 2, 2, 0.8, 1);

    // Then
    expect(result).toEqual(pixels);
  });

  it("increases contrast at edges when sharpening", () => {
    // Given — 3x1 image: dark-light-dark edge pattern
    const pixels = new Uint8ClampedArray([
      50, 50, 50, 255, 200, 200, 200, 255, 50, 50, 50, 255,
    ]);

    // When
    const result = sharpenPixelData(pixels, 3, 1, 1.0, 1);

    // Then — center pixel should become brighter (pushed away from neighbors)
    expect(result[4]).toBeGreaterThan(200);
  });

  it("clamps sharpened values to 0-255 range", () => {
    // Given — extreme edge: 0-255-0 with high amount
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);

    // When
    const result = sharpenPixelData(pixels, 3, 1, 5.0, 1);

    // Then — all RGB values stay within valid range
    for (let i = 0; i < result.length; i += 4) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
      expect(result[i + 1]).toBeGreaterThanOrEqual(0);
      expect(result[i + 1]).toBeLessThanOrEqual(255);
      expect(result[i + 2]).toBeGreaterThanOrEqual(0);
      expect(result[i + 2]).toBeLessThanOrEqual(255);
    }
  });

  it("preserves alpha channel unchanged", () => {
    // Given — pixels with varying alpha
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 128, 255, 255, 255, 64, 0, 0, 0, 200,
    ]);

    // When
    const result = sharpenPixelData(pixels, 3, 1, 1.0, 1);

    // Then
    expect(result[3]).toBe(128);
    expect(result[7]).toBe(64);
    expect(result[11]).toBe(200);
  });
});

describe("applyUnsharpMask", () => {
  it("reads pixel data, sharpens it, and writes it back", () => {
    // Given
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d")!;
    const getImageDataSpy = vi.spyOn(ctx, "getImageData");
    const putImageDataSpy = vi.spyOn(ctx, "putImageData");

    // When
    applyUnsharpMask(canvas, 0.6, 1);

    // Then
    expect(getImageDataSpy).toHaveBeenCalledWith(0, 0, 2, 2);
    expect(putImageDataSpy).toHaveBeenCalledTimes(1);
  });
});

describe("applyUnsharpMaskAsync", () => {
  it("reads pixel data, sharpens it via worker, and writes it back", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d")!;
    const getImageDataSpy = vi.spyOn(ctx, "getImageData");
    const putImageDataSpy = vi.spyOn(ctx, "putImageData");

    await applyUnsharpMaskAsync(canvas, 0.6, 1);

    expect(getImageDataSpy).toHaveBeenCalledWith(0, 0, 2, 2);
    expect(putImageDataSpy).toHaveBeenCalledTimes(1);
  });
});

describe("clampPosition", () => {
  it("exports MIN_VISIBLE constant", () => {
    expect(MIN_VISIBLE).toBe(50);
  });

  it("allows movement when image is smaller than canvas", () => {
    // image 200x200, canvas 400x400
    // minPos = 50 - 200 = -150, maxPos = 400 - 50 = 350
    const result = clampPosition(
      { x: 100, y: 100 },
      { width: 200, height: 200 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("allows panning when image is larger than canvas", () => {
    // image 800x800, canvas 400x400
    // minPos = 50 - 800 = -750, maxPos = 400 - 50 = 350
    const result = clampPosition(
      { x: 50, y: 50 },
      { width: 800, height: 800 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("clamps to maximum offset at boundary", () => {
    // image 600x600, canvas 400x400
    // maxPos = 400 - 50 = 350
    const result = clampPosition(
      { x: 500, y: 500 },
      { width: 600, height: 600 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 350, y: 350 });
  });

  it("clamps negative offset at boundary", () => {
    // image 600x600, canvas 400x400
    // minPos = 50 - 600 = -550
    const result = clampPosition(
      { x: -600, y: -600 },
      { width: 600, height: 600 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: -550, y: -550 });
  });

  it("accounts for scale when clamping", () => {
    // image 300x300 * scale 2 = 600x600, canvas 400x400
    // maxPos = 400 - 50 = 350
    const result = clampPosition(
      { x: 500, y: 500 },
      { width: 300, height: 300 },
      { width: 400, height: 400 },
      2,
    );

    expect(result).toEqual({ x: 350, y: 350 });
  });
});

describe("detailPreservingResize", () => {
  function createMockSource(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas as unknown as HTMLImageElement;
  }

  it("uses single draw and sharpens with 0.6 amount on upscale", () => {
    // Given — source 50x50, target 200x200 (upscale)
    const source = createMockSource(50, 50);
    const target = document.createElement("canvas");
    target.width = 200;
    target.height = 200;
    const ctx = target.getContext("2d")!;
    const fillRectSpy = vi.spyOn(ctx, "fillRect");
    const drawImageSpy = vi.spyOn(ctx, "drawImage");

    // When
    detailPreservingResize(source, 0, 0, 50, 50, target);

    // Then — fills background, draws once, calls applyUnsharpMask
    expect(fillRectSpy).toHaveBeenCalledWith(0, 0, 200, 200);
    expect(drawImageSpy).toHaveBeenCalledTimes(1);
    expect(drawImageSpy).toHaveBeenCalledWith(
      source,
      0,
      0,
      50,
      50,
      0,
      0,
      200,
      200,
    );
  });

  it("draws directly without halving when downscale is within 2x", () => {
    // Given — source 300x300, target 200x200 (ratio 1.5x, within 2x)
    const source = createMockSource(300, 300);
    const target = document.createElement("canvas");
    target.width = 200;
    target.height = 200;
    const ctx = target.getContext("2d")!;
    const drawImageSpy = vi.spyOn(ctx, "drawImage");

    // When
    detailPreservingResize(source, 0, 0, 300, 300, target);

    // Then — single draw directly from source (no intermediate canvases)
    expect(drawImageSpy).toHaveBeenCalledTimes(1);
    expect(drawImageSpy).toHaveBeenCalledWith(
      source,
      0,
      0,
      300,
      300,
      0,
      0,
      200,
      200,
    );
  });

  it("performs multi-pass halving for large downscale ratios", () => {
    // Given — source 800x800, target 100x100 (8x downscale, needs halving)
    // 800 → 400 → 200 (200/2 = 100, not > 100, so stop) → final draw from 200 to 100
    const source = createMockSource(800, 800);
    const target = document.createElement("canvas");
    target.width = 100;
    target.height = 100;
    const createElementSpy = vi.spyOn(document, "createElement");

    // When
    detailPreservingResize(source, 0, 0, 800, 800, target);

    // Then — intermediate canvases were created for halving steps
    const canvasCalls = createElementSpy.mock.calls.filter(
      (call) => call[0] === "canvas",
    );
    expect(canvasCalls.length).toBe(2);
  });

  it("extracts the specified source region on upscale", () => {
    // Given — source 400x400, extract region (100, 50, 200, 150), target 300x300
    const source = createMockSource(400, 400);
    const target = document.createElement("canvas");
    target.width = 300;
    target.height = 300;
    const ctx = target.getContext("2d")!;
    const drawImageSpy = vi.spyOn(ctx, "drawImage");

    // When
    detailPreservingResize(source, 100, 50, 200, 150, target);

    // Then — drawImage uses the specified source region
    expect(drawImageSpy).toHaveBeenCalledWith(
      source,
      100,
      50,
      200,
      150,
      0,
      0,
      300,
      300,
    );
  });

  it("fills background with BG_COLOR", () => {
    // Given
    const source = createMockSource(100, 100);
    const target = document.createElement("canvas");
    target.width = 200;
    target.height = 200;
    const ctx = target.getContext("2d")!;

    // When
    detailPreservingResize(source, 0, 0, 100, 100, target);

    // Then
    expect(ctx.fillStyle).toBe(BG_COLOR);
  });

  it("sets imageSmoothingQuality to high", () => {
    // Given
    const source = createMockSource(100, 100);
    const target = document.createElement("canvas");
    target.width = 200;
    target.height = 200;
    const ctx = target.getContext("2d")!;

    // When
    detailPreservingResize(source, 0, 0, 100, 100, target);

    // Then
    expect(ctx.imageSmoothingQuality).toBe("high");
  });
});

const RATIO_11_15 = { w: 11, h: 15 };
const RATIO_29_36 = { w: 29, h: 36 };

describe("reduceRatio", () => {
  it("reduces the default canvas to 11:15", () => {
    // When
    const ratio = reduceRatio(CANVAS_WIDTH, CANVAS_HEIGHT);

    // Then
    expect(ratio).toEqual(RATIO_11_15);
  });

  it("reduces the classic borderless canvas to 29:36", () => {
    // When
    const ratio = reduceRatio(3712, 4608);

    // Then
    expect(ratio).toEqual(RATIO_29_36);
  });

  it("reduces a square canvas to 1:1", () => {
    // When
    const ratio = reduceRatio(2048, 2048);

    // Then
    expect(ratio).toEqual({ w: 1, h: 1 });
  });
});

describe("canvasSizeForStep", () => {
  it("maps the default step to the default canvas size", () => {
    // When
    const size = canvasSizeForStep(320, RATIO_11_15);

    // Then
    expect(size).toEqual({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  });

  it("maps a step on the 29:36 grid to the classic borderless size", () => {
    // When
    const size = canvasSizeForStep(128, RATIO_29_36);

    // Then
    expect(size).toEqual({ width: 3712, height: 4608 });
  });

  it("produces sizes that hold the ratio exactly", () => {
    // Given
    const steps = [1, 37, 128, 320, 500];

    // When
    const sizes = steps.map((step) => canvasSizeForStep(step, RATIO_29_36));

    // Then
    for (const size of sizes) {
      expect(size.width / RATIO_29_36.w).toBe(size.height / RATIO_29_36.h);
    }
  });
});

describe("canvasStepBounds", () => {
  it("derives the 11:15 bounds from the canvas width limits", () => {
    // When
    const bounds = canvasStepBounds(RATIO_11_15);

    // Then
    expect(bounds).toEqual({
      min: MIN_CANVAS_WIDTH / 11,
      max: MAX_CANVAS_WIDTH / 11,
    });
  });

  it("derives narrower bounds for a wider ratio unit", () => {
    // When
    const bounds = canvasStepBounds(RATIO_29_36);

    // Then
    expect(bounds).toEqual({ min: 38, max: 265 });
    expect(bounds.min * RATIO_29_36.w).toBeGreaterThanOrEqual(
      MIN_CANVAS_WIDTH,
    );
    expect(bounds.max * RATIO_29_36.w).toBeLessThanOrEqual(MAX_CANVAS_WIDTH);
  });

  it("yields at least one legal step for a ratio unit wider than the limit", () => {
    // When
    const bounds = canvasStepBounds({ w: 20000, h: 1 });

    // Then
    expect(bounds).toEqual({ min: 1, max: 1 });
  });
});

describe("nearestCanvasStep", () => {
  it("maps a width already on the grid back to its own step", () => {
    // When
    const step = nearestCanvasStep(CANVAS_WIDTH, RATIO_11_15);

    // Then
    expect(step).toBe(320);
  });

  it("maps a width off the grid to the nearest step", () => {
    // When
    const step = nearestCanvasStep(3712, RATIO_11_15);

    // Then
    expect(step).toBe(337);
  });

  it("clamps a width below the range to the minimum step", () => {
    // When
    const step = nearestCanvasStep(10, RATIO_29_36);

    // Then
    expect(step).toBe(canvasStepBounds(RATIO_29_36).min);
  });

  it("clamps a width above the range to the maximum step", () => {
    // When
    const step = nearestCanvasStep(20000, RATIO_29_36);

    // Then
    expect(step).toBe(canvasStepBounds(RATIO_29_36).max);
  });
});

describe("canvasSizeForDimension", () => {
  it("keeps a typed height exactly and derives the width", () => {
    // When
    const size = canvasSizeForDimension("height", 4600, RATIO_29_36);

    // Then
    expect(size).toEqual({ width: 3706, height: 4600 });
  });

  it("keeps a typed width exactly and derives the height", () => {
    // When
    const size = canvasSizeForDimension("width", 3520, RATIO_11_15);

    // Then
    expect(size).toEqual({ width: 3520, height: 4800 });
  });
});
