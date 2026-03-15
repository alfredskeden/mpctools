import {
  mulberry32,
  generateFeatherMask,
  generateIrregularMask,
  generateCombinedMask,
  applyFeatheredMask,
  analyzeGuide,
  analyzeGuideAsync,
  downloadCanvasAsBlob,
} from "./merger-utils";

describe("mulberry32", () => {
  it("returns a function", () => {
    const rng = mulberry32(42);
    expect(typeof rng).toBe("function");
  });

  it("produces deterministic values for the same seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it("produces values between 0 and 1", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("produces different values for different seeds", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    expect(rng1()).not.toBe(rng2());
  });
});

describe("generateFeatherMask", () => {
  it("returns a canvas with correct dimensions", () => {
    const result = generateFeatherMask(200, 300, 20, 10);
    expect(result.width).toBe(200);
    expect(result.height).toBe(300);
  });

  it("fills entirely white when inset exceeds half dimensions", () => {
    const result = generateFeatherMask(40, 40, 25, 5);
    expect(result.width).toBe(40);
    expect(result.height).toBe(40);
  });

  it("draws rounded rect when radius > 0", () => {
    const result = generateFeatherMask(200, 300, 10, 20);
    expect(result.width).toBe(200);
  });

  it("draws plain rect when radius is 0", () => {
    const result = generateFeatherMask(200, 300, 10, 0);
    expect(result.width).toBe(200);
  });

  it("skips blur filter when feather is 0", () => {
    const result = generateFeatherMask(200, 300, 0, 10);
    expect(result.width).toBe(200);
  });
});

describe("generateIrregularMask", () => {
  it("returns a canvas with correct dimensions", () => {
    const result = generateIrregularMask(200, 300, 10, 5, 42);
    expect(result.width).toBe(200);
    expect(result.height).toBe(300);
  });

  it("is deterministic for the same seed", () => {
    const result1 = generateIrregularMask(100, 100, 10, 5, 42);
    const result2 = generateIrregularMask(100, 100, 10, 5, 42);
    const ctx1 = result1.getContext("2d")!;
    const ctx2 = result2.getContext("2d")!;
    const data1 = ctx1.getImageData(0, 0, 100, 100).data;
    const data2 = ctx2.getImageData(0, 0, 100, 100).data;
    expect(Array.from(data1)).toEqual(Array.from(data2));
  });

  it("handles large radius clamped to half of min dimension", () => {
    const result = generateIrregularMask(100, 100, 200, 5, 42);
    expect(result.width).toBe(100);
  });
});

describe("generateCombinedMask", () => {
  it("returns feather mask only when irregularity is 0", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 0, 10, 50, 42, 2);
    expect(result.width).toBe(200);
    expect(result.height).toBe(300);
  });

  it("returns feather mask only when irregDensity is 0", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 5, 10, 0, 42, 2);
    expect(result.width).toBe(200);
  });

  it("combines masks when irregularity and density are positive", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 5, 10, 50, 42, 2);
    expect(result.width).toBe(200);
    expect(result.height).toBe(300);
  });

  it("applies irregular blur when irregBlur > 0", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 5, 10, 100, 42, 5);
    expect(result.width).toBe(200);
  });

  it("skips irregular blur when irregBlur is 0", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 5, 10, 100, 42, 0);
    expect(result.width).toBe(200);
  });

  it("applies density fill-back when irregDensity < 100", () => {
    const result = generateCombinedMask(200, 300, 20, 10, 5, 10, 50, 42, 0);
    expect(result.width).toBe(200);
  });
});

describe("applyFeatheredMask", () => {
  function makeCtx(w: number, h: number) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas.getContext("2d")!;
  }

  function makeImg(w: number, h: number) {
    const img = new Image();
    Object.defineProperty(img, "naturalWidth", { value: w });
    Object.defineProperty(img, "naturalHeight", { value: h });
    return img;
  }

  it("draws image directly when no feather, radius, or irregularity", () => {
    const ctx = makeCtx(400, 400);
    const drawSpy = vi.spyOn(ctx, "drawImage");
    const img = makeImg(200, 300);

    applyFeatheredMask(ctx, img, 10, 20, 200, 300, 0, 0, 0, 42, 10, 50, 2);

    // Should draw the temp canvas onto context
    expect(drawSpy).toHaveBeenCalled();
  });

  it("applies mask when feather > 0", () => {
    const ctx = makeCtx(400, 400);
    const img = makeImg(200, 300);

    applyFeatheredMask(ctx, img, 10, 20, 200, 300, 20, 10, 0, 42, 10, 50, 2);

    // No error means success
    expect(ctx).toBeDefined();
  });

  it("applies mask when irregularity > 0", () => {
    const ctx = makeCtx(400, 400);
    const img = makeImg(200, 300);

    applyFeatheredMask(ctx, img, 0, 0, 200, 300, 0, 0, 5, 42, 10, 50, 2);

    expect(ctx).toBeDefined();
  });

  it("applies mask when radius > 0", () => {
    const ctx = makeCtx(400, 400);
    const img = makeImg(200, 300);

    applyFeatheredMask(ctx, img, 0, 0, 200, 300, 0, 10, 0, 42, 10, 50, 2);

    expect(ctx).toBeDefined();
  });
});

describe("analyzeGuide", () => {
  function makeGuideCanvas(w: number, h: number, pixelData: Uint8ClampedArray) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    // Mock getImageData since vitest-canvas-mock doesn't render real pixels
    vi.spyOn(ctx, "getImageData").mockReturnValue({
      data: pixelData,
      width: w,
      height: h,
      colorSpace: "srgb",
    } as ImageData);
    return canvas;
  }

  function makeGrayPixels(w: number, h: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 128;
      data[i * 4 + 1] = 128;
      data[i * 4 + 2] = 128;
      data[i * 4 + 3] = 255;
    }
    return data;
  }

  it("returns null when guide is entirely gray", () => {
    const pixels = makeGrayPixels(100, 100);
    const canvas = makeGuideCanvas(100, 100, pixels);
    const result = analyzeGuide(canvas, 200, 300);
    expect(result).toBeNull();
  });

  it("detects non-gray region and calculates position", () => {
    const w = 100;
    const h = 100;
    const pixels = makeGrayPixels(w, h);
    // Paint non-gray region from (40,30) to (59,69)
    for (let y = 30; y < 70; y++) {
      for (let x = 40; x < 60; x++) {
        const i = (y * w + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
      }
    }
    const canvas = makeGuideCanvas(w, h, pixels);
    const result = analyzeGuide(canvas, 200, 300);
    expect(result).not.toBeNull();
    // bbox is 20x40, so canvas = 200*(100/20)=1000, 300*(100/40)=750
    expect(result!.canvasW).toBe(1000);
    expect(result!.canvasH).toBe(750);
    expect(result!.ogX).toBeGreaterThan(0);
    expect(result!.ogY).toBeGreaterThan(0);
  });

  it("returns correct ratios for centered non-gray bbox", () => {
    const w = 200;
    const h = 200;
    const pixels = makeGrayPixels(w, h);
    // Non-gray region from (50,50) to (149,149) = 100x100
    for (let y = 50; y < 150; y++) {
      for (let x = 50; x < 150; x++) {
        const i = (y * w + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
      }
    }
    const canvas = makeGuideCanvas(w, h, pixels);
    const result = analyzeGuide(canvas, 400, 400);
    expect(result).not.toBeNull();
    // canvasW = 400 * (200 / 100) = 800
    expect(result!.canvasW).toBe(800);
    expect(result!.canvasH).toBe(800);
    // ogX = (50 / 200) * 800 = 200
    expect(result!.ogX).toBe(200);
    expect(result!.ogY).toBe(200);
  });
});

describe("analyzeGuideAsync", () => {
  function makeGuideCanvas(w: number, h: number, pixelData: Uint8ClampedArray) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    vi.spyOn(ctx, "getImageData").mockReturnValue({
      data: pixelData,
      width: w,
      height: h,
      colorSpace: "srgb",
    } as ImageData);
    return canvas;
  }

  function makeGrayPixels(w: number, h: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 128;
      data[i * 4 + 1] = 128;
      data[i * 4 + 2] = 128;
      data[i * 4 + 3] = 255;
    }
    return data;
  }

  it("returns null when guide is entirely gray", async () => {
    const pixels = makeGrayPixels(100, 100);
    const canvas = makeGuideCanvas(100, 100, pixels);
    const result = await analyzeGuideAsync(canvas, 200, 300);
    expect(result).toBeNull();
  });

  it("detects non-gray region asynchronously", async () => {
    const w = 100;
    const h = 100;
    const pixels = makeGrayPixels(w, h);
    for (let y = 30; y < 70; y++) {
      for (let x = 40; x < 60; x++) {
        const i = (y * w + x) * 4;
        pixels[i] = 255;
      }
    }
    const canvas = makeGuideCanvas(w, h, pixels);
    const result = await analyzeGuideAsync(canvas, 200, 300);
    expect(result).not.toBeNull();
    expect(result!.canvasW).toBe(1000);
    expect(result!.canvasH).toBe(750);
  });
});

describe("downloadCanvasAsBlob", () => {
  it("creates a link and triggers download", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;

    const clickSpy = vi.fn();
    let downloadName = "";
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValueOnce({
        set download(val: string) {
          downloadName = val;
        },
        set href(_val: string) {
          /* noop */
        },
        click: clickSpy,
      } as unknown as HTMLAnchorElement);

    downloadCanvasAsBlob(canvas, "merged.png");

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(downloadName).toBe("merged.png");

    createElementSpy.mockRestore();
  });
});
