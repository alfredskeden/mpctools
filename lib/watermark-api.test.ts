const mockRemoveWatermarkInWorker = vi.fn();
vi.mock("./worker-client", () => ({
  removeWatermarkInWorker: (...args: unknown[]) =>
    mockRemoveWatermarkInWorker(...args),
}));

import { removeWatermark } from "./watermark-api";

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

  it("sends pixel data to worker with correct dimensions", async () => {
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
