import { handleMessage } from "./image.worker";

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
});
