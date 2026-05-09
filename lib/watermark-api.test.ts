const mockRemoveWatermarkInWorker = vi.fn();
vi.mock("./worker-client", () => ({
  removeWatermarkInWorker: (...args: unknown[]) =>
    mockRemoveWatermarkInWorker(...args),
}));

import { removeWatermark, removeWatermarkFromPixels } from "./watermark-api";

const mockGetImageData = vi.fn();
const mockDrawImage = vi.fn();
const mockPutImageData = vi.fn();
const mockConvertToBlob = vi.fn();
const mockClose = vi.fn();

vi.stubGlobal("createImageBitmap", vi.fn());
class MockOffscreenCanvas {
  width: number;
  height: number;
  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }
  getContext() {
    return {
      drawImage: mockDrawImage,
      getImageData: mockGetImageData,
      putImageData: mockPutImageData,
    };
  }
  convertToBlob = mockConvertToBlob;
}
vi.stubGlobal("OffscreenCanvas", MockOffscreenCanvas);

function setupDefaults(overrides: { width?: number; height?: number } = {}) {
  const w = overrides.width ?? 100;
  const h = overrides.height ?? 100;
  const pixels = new Uint8ClampedArray(w * h * 4);

  vi.mocked(createImageBitmap).mockResolvedValue({
    width: w,
    height: h,
    close: mockClose,
  } as unknown as ImageBitmap);

  mockGetImageData.mockReturnValue({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  });

  mockRemoveWatermarkInWorker.mockResolvedValue({
    pixels,
    width: w,
    height: h,
    metadata: {
      corner: "bottom-right",
      confidence: 0.87,
      alphaGain: 1.05,
      source: "adaptive",
    },
  });

  mockConvertToBlob.mockResolvedValue(
    new Blob(["fake-png"], { type: "image/png" }),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("removeWatermark", () => {
  it("decodes the file, processes via worker, and returns blob with metadata", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    const result = await removeWatermark(file);

    // Then
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.metadata).toEqual({
      corner: "bottom-right",
      confidence: 0.87,
      alphaGain: 1.05,
      source: "adaptive",
    });
  });

  it("returns original pixel data for re-processing", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    const result = await removeWatermark(file);

    // Then
    expect(result.pixelData.pixels).toBeInstanceOf(Uint8ClampedArray);
    expect(result.pixelData.width).toBe(100);
    expect(result.pixelData.height).toBe(100);
  });

  it("passes the file to createImageBitmap for decoding", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    await removeWatermark(file);

    // Then
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it("closes the bitmap after extracting pixel data", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    await removeWatermark(file);

    // Then
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("passes adaptive false by default to worker", async () => {
    // Given
    setupDefaults({ width: 200, height: 150 });
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    await removeWatermark(file);

    // Then
    expect(mockRemoveWatermarkInWorker).toHaveBeenCalledWith(
      expect.any(Uint8ClampedArray),
      200,
      150,
      { adaptive: undefined, settings: undefined, confidenceThreshold: undefined },
    );
  });

  it("passes adaptive true when option is set", async () => {
    // Given
    setupDefaults({ width: 200, height: 150 });
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    await removeWatermark(file, undefined, { adaptive: true });

    // Then
    expect(mockRemoveWatermarkInWorker).toHaveBeenCalledWith(
      expect.any(Uint8ClampedArray),
      200,
      150,
      { adaptive: true, settings: undefined, confidenceThreshold: undefined },
    );
  });

  it("forwards settings and confidenceThreshold to the worker", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });
    const settings = {
      corner: "top-left" as const,
      alphaGain: 1.4,
      feather: 0.5,
      postLightness: 0.1,
      maskExpand: 8,
    };

    // When
    await removeWatermark(file, undefined, {
      adaptive: true,
      settings,
      confidenceThreshold: 0.6,
    });

    // Then
    expect(mockRemoveWatermarkInWorker).toHaveBeenCalledWith(
      expect.any(Uint8ClampedArray),
      100,
      100,
      { adaptive: true, settings, confidenceThreshold: 0.6 },
    );
  });

  it("encodes the result pixels to a PNG blob", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When
    await removeWatermark(file);

    // Then
    expect(mockConvertToBlob).toHaveBeenCalledWith({ type: "image/png" });
  });

  it("throws AbortError immediately if signal is already aborted", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });
    const controller = new AbortController();
    controller.abort();

    // When / Then
    await expect(removeWatermark(file, controller.signal)).rejects.toThrow(
      "Aborted",
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("throws AbortError after worker completes if signal was aborted during processing", async () => {
    // Given
    setupDefaults();
    const file = new File(["pixels"], "test.png", { type: "image/png" });
    const controller = new AbortController();

    mockRemoveWatermarkInWorker.mockImplementation(async () => {
      controller.abort();
      return {
        pixels: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
        metadata: { corner: "", confidence: 0, alphaGain: 1, source: "preset" },
      };
    });

    // When / Then
    await expect(removeWatermark(file, controller.signal)).rejects.toThrow(
      "Aborted",
    );
  });

  it("propagates createImageBitmap errors", async () => {
    // Given
    vi.mocked(createImageBitmap).mockRejectedValue(
      new Error("Invalid image data"),
    );
    const file = new File(["bad"], "broken.png", { type: "image/png" });

    // When / Then
    await expect(removeWatermark(file)).rejects.toThrow("Invalid image data");
  });

  it("propagates worker errors", async () => {
    // Given
    setupDefaults();
    mockRemoveWatermarkInWorker.mockRejectedValue(
      new Error("Processing failed"),
    );
    const file = new File(["pixels"], "test.png", { type: "image/png" });

    // When / Then
    await expect(removeWatermark(file)).rejects.toThrow("Processing failed");
  });
});

describe("removeWatermarkFromPixels", () => {
  it("processes pixels via worker and returns blob with metadata", async () => {
    // Given
    setupDefaults();
    const pixels = new Uint8ClampedArray(100 * 100 * 4);

    // When
    const result = await removeWatermarkFromPixels(pixels, 100, 100);

    // Then
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.metadata).toEqual({
      corner: "bottom-right",
      confidence: 0.87,
      alphaGain: 1.05,
      source: "adaptive",
    });
  });

  it("preserves original pixel data reference in result", async () => {
    // Given
    setupDefaults();
    const pixels = new Uint8ClampedArray(100 * 100 * 4);

    // When
    const result = await removeWatermarkFromPixels(pixels, 100, 100);

    // Then
    expect(result.pixelData.pixels).toBe(pixels);
    expect(result.pixelData.width).toBe(100);
    expect(result.pixelData.height).toBe(100);
  });

  it("passes adaptive option to worker", async () => {
    // Given
    setupDefaults();
    const pixels = new Uint8ClampedArray(100 * 100 * 4);

    // When
    await removeWatermarkFromPixels(pixels, 100, 100, { adaptive: true });

    // Then
    expect(mockRemoveWatermarkInWorker).toHaveBeenCalledWith(
      expect.any(Uint8ClampedArray),
      100,
      100,
      { adaptive: true, settings: undefined, confidenceThreshold: undefined },
    );
  });

  it("forwards settings and confidenceThreshold from pixels API", async () => {
    // Given
    setupDefaults();
    const pixels = new Uint8ClampedArray(100 * 100 * 4);
    const settings = {
      corner: "bottom-left" as const,
      alphaGain: 0.9,
      feather: 0.7,
      postLightness: -0.1,
      maskExpand: 3,
    };

    // When
    await removeWatermarkFromPixels(pixels, 100, 100, {
      adaptive: false,
      settings,
      confidenceThreshold: 0.4,
    });

    // Then
    expect(mockRemoveWatermarkInWorker).toHaveBeenCalledWith(
      expect.any(Uint8ClampedArray),
      100,
      100,
      { adaptive: false, settings, confidenceThreshold: 0.4 },
    );
  });

  it("sends a copy of pixels to worker to avoid buffer transfer issues", async () => {
    // Given
    setupDefaults();
    const pixels = new Uint8ClampedArray(100 * 100 * 4);

    // When
    await removeWatermarkFromPixels(pixels, 100, 100);

    // Then
    const sentPixels = mockRemoveWatermarkInWorker.mock.calls[0][0];
    expect(sentPixels).not.toBe(pixels);
    expect(sentPixels).toEqual(pixels);
  });

  it("propagates worker errors", async () => {
    // Given
    mockRemoveWatermarkInWorker.mockRejectedValue(
      new Error("Processing failed"),
    );
    const pixels = new Uint8ClampedArray(100 * 100 * 4);

    // When / Then
    await expect(
      removeWatermarkFromPixels(pixels, 100, 100),
    ).rejects.toThrow("Processing failed");
  });
});
