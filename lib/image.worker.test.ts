import { handleMessage } from "./image.worker";

vi.mock("./watermark-detection", () => ({
  detectBestCandidate: vi.fn(),
}));

vi.mock("./watermark-removal", () => ({
  runPipeline: vi.fn(),
}));

import { detectBestCandidate } from "./watermark-detection";
import { runPipeline } from "./watermark-removal";

afterEach(() => {
  vi.clearAllMocks();
});

describe("image worker handleMessage", () => {
  describe("SHARPEN", () => {
    it("returns sharpened pixel data with correct type and id", () => {
      const pixels = new Uint8ClampedArray([
        100, 100, 100, 255, 100, 100, 100, 255,
        100, 100, 100, 255, 100, 100, 100, 255,
      ]);

      const response = handleMessage({
        type: "SHARPEN",
        id: 42,
        pixels,
        width: 2,
        height: 2,
        amount: 1,
        radius: 1,
      });

      expect(response.type).toBe("SHARPEN");
      expect(response.id).toBe(42);
      expect(response).toHaveProperty("pixels");
      if (response.type === "SHARPEN") {
        expect(response.pixels).toBeInstanceOf(Uint8ClampedArray);
        expect(response.pixels.length).toBe(16);
      }
    });
  });

  describe("ANALYZE_GUIDE", () => {
    it("returns null when all pixels are gray", () => {
      const data = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }

      const response = handleMessage({
        type: "ANALYZE_GUIDE",
        id: 7,
        data,
        width: 10,
        height: 10,
        ogWidth: 100,
        ogHeight: 100,
      });

      expect(response.type).toBe("ANALYZE_GUIDE");
      expect(response.id).toBe(7);
      if (response.type === "ANALYZE_GUIDE") {
        expect(response.result).toBeNull();
      }
    });

    it("returns analysis when non-gray pixels exist", () => {
      const data = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
      // Add a bright pixel at (5, 5)
      const idx = (5 * 10 + 5) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;

      const response = handleMessage({
        type: "ANALYZE_GUIDE",
        id: 3,
        data,
        width: 10,
        height: 10,
        ogWidth: 100,
        ogHeight: 100,
      });

      expect(response.type).toBe("ANALYZE_GUIDE");
      if (response.type === "ANALYZE_GUIDE") {
        expect(response.result).not.toBeNull();
        expect(response.result!.canvasW).toBeGreaterThan(0);
      }
    });
  });

  describe("REMOVE_WATERMARK", () => {
    it("runs adaptive detection when adaptive flag is true", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);
      const mockDetection = { corner: "bottom-right", accepted: true };

      vi.mocked(detectBestCandidate).mockReturnValue(mockDetection as never);
      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1.1,
        confidence: 0.92,
        accepted: true,
        detectionSource: "adaptive",
      });

      // When
      const response = handleMessage({
        type: "REMOVE_WATERMARK",
        id: 5,
        pixels,
        width: 4,
        height: 4,
        adaptive: true,
      });

      // Then
      expect(response.type).toBe("REMOVE_WATERMARK");
      expect(response.id).toBe(5);
      expect(detectBestCandidate).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        { corner: undefined },
      );
      expect(runPipeline).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        {},
        mockDetection,
      );
      if (response.type === "REMOVE_WATERMARK") {
        expect(response.pixels).toBe(resultPixels);
        expect(response.width).toBe(4);
        expect(response.height).toBe(4);
        expect(response.metadata).toEqual({
          corner: "bottom-right",
          confidence: 0.92,
          alphaGain: 1.1,
          source: "adaptive",
        });
      }
    });

    it("skips adaptive detection when adaptive flag is false", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);

      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1,
        confidence: 0.74,
        accepted: false,
        detectionSource: "preset",
      });

      // When
      const response = handleMessage({
        type: "REMOVE_WATERMARK",
        id: 6,
        pixels,
        width: 4,
        height: 4,
        adaptive: false,
      });

      // Then
      expect(detectBestCandidate).not.toHaveBeenCalled();
      expect(runPipeline).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        {},
        null,
      );
      if (response.type === "REMOVE_WATERMARK") {
        expect(response.metadata.source).toBe("preset");
      }
    });

    it("skips adaptive detection when adaptive flag is omitted", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);

      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1,
        confidence: 0.74,
        accepted: false,
        detectionSource: "preset",
      });

      // When
      handleMessage({
        type: "REMOVE_WATERMARK",
        id: 7,
        pixels,
        width: 4,
        height: 4,
      });

      // Then
      expect(detectBestCandidate).not.toHaveBeenCalled();
      expect(runPipeline).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        {},
        null,
      );
    });

    it("forwards custom settings and threshold-passes detection through", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);
      const customSettings = {
        corner: "top-left" as const,
        alphaGain: 1.4,
        feather: 0.5,
        postLightness: 0.1,
        maskExpand: 8,
      };
      const mockDetection = {
        corner: "top-left",
        accepted: true,
        confidence: 0.9,
      };
      vi.mocked(detectBestCandidate).mockReturnValue(mockDetection as never);
      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1.4,
        confidence: 0.9,
        accepted: true,
        detectionSource: "adaptive",
      });

      // When
      handleMessage({
        type: "REMOVE_WATERMARK",
        id: 11,
        pixels,
        width: 4,
        height: 4,
        adaptive: true,
        settings: customSettings,
        confidenceThreshold: 0.5,
      });

      // Then
      expect(detectBestCandidate).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        { corner: "top-left" },
      );
      expect(runPipeline).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        customSettings,
        mockDetection,
      );
    });

    it("drops detection when confidence is below threshold", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);
      vi.mocked(detectBestCandidate).mockReturnValue({
        corner: "bottom-right",
        accepted: true,
        confidence: 0.4,
      } as never);
      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1,
        confidence: 0.74,
        accepted: false,
        detectionSource: "preset",
      });

      // When
      handleMessage({
        type: "REMOVE_WATERMARK",
        id: 12,
        pixels,
        width: 4,
        height: 4,
        adaptive: true,
        confidenceThreshold: 0.6,
      });

      // Then
      expect(runPipeline).toHaveBeenCalledWith(
        { data: pixels, width: 4, height: 4 },
        {},
        null,
      );
    });

    it("returns empty corner when detection is not accepted", () => {
      // Given
      const pixels = new Uint8ClampedArray(4 * 4 * 4);
      const resultPixels = new Uint8ClampedArray(4 * 4 * 4);

      vi.mocked(detectBestCandidate).mockReturnValue(null);
      vi.mocked(runPipeline).mockReturnValue({
        imageData: { data: resultPixels, width: 4, height: 4 },
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1,
        confidence: 0.74,
        accepted: false,
        detectionSource: "preset",
      });

      // When
      const response = handleMessage({
        type: "REMOVE_WATERMARK",
        id: 9,
        pixels,
        width: 4,
        height: 4,
        adaptive: true,
      });

      // Then
      if (response.type === "REMOVE_WATERMARK") {
        expect(response.metadata.corner).toBe("");
        expect(response.metadata.source).toBe("preset");
      }
    });
  });
});
