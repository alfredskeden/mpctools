// Reset module state between tests since worker-client uses module-level singleton
beforeEach(() => {
  vi.resetModules();
});

describe("worker-client", () => {
  describe("sharpenInWorker", () => {
    it("falls back to main-thread execution when Worker is unavailable", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { sharpenInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray([
        100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100,
        100, 255,
      ]);

      const result = await fn(pixels, 2, 2, 0, 1);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result.length).toBe(16);
      for (let i = 0; i < pixels.length; i++) {
        expect(result[i]).toBe(pixels[i]);
      }

      globalThis.Worker = originalWorker;
    });

    it("falls back when Worker constructor throws", async () => {
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class MockWorker {
        constructor() {
          throw new Error("Worker not supported");
        }
      } as unknown as typeof Worker;

      const { sharpenInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray([
        100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100,
        100, 255,
      ]);

      const result = await fn(pixels, 2, 2, 0, 1);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result.length).toBe(16);

      globalThis.Worker = originalWorker;
    });

    it("uses worker when available and resolves with sharpened data", async () => {
      const originalWorker = globalThis.Worker;
      let onMessageHandler: ((e: MessageEvent) => void) | null = null;

      globalThis.Worker = class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        constructor() {
          // Capture reference for later use
          setTimeout(() => {
            onMessageHandler = this.onmessage;
          }, 0);
        }
        postMessage(data: { type: string; id: number }) {
          // Simulate async worker response
          const resultPixels = new Uint8ClampedArray([
            110, 110, 110, 255, 110, 110, 110, 255, 110, 110, 110, 255, 110,
            110, 110, 255,
          ]);
          setTimeout(() => {
            onMessageHandler?.({
              data: { type: "SHARPEN", id: data.id, pixels: resultPixels },
            } as MessageEvent);
          }, 0);
        }
      } as unknown as typeof Worker;

      const { sharpenInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray([
        100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100,
        100, 255,
      ]);

      const result = await fn(pixels, 2, 2, 1, 1);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result[0]).toBe(110);

      globalThis.Worker = originalWorker;
    });
  });

  describe("analyzeGuideInWorker", () => {
    it("falls back to main-thread execution when Worker is unavailable", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { analyzeGuideInWorker: fn } = await import("./worker-client");

      const data = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }

      const result = await fn(data, 10, 10, 100, 100);

      expect(result).toBeNull();

      globalThis.Worker = originalWorker;
    });

    it("uses worker when available and resolves with analysis", async () => {
      const originalWorker = globalThis.Worker;
      let onMessageHandler: ((e: MessageEvent) => void) | null = null;

      globalThis.Worker = class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        constructor() {
          setTimeout(() => {
            onMessageHandler = this.onmessage;
          }, 0);
        }
        postMessage(data: { type: string; id: number }) {
          setTimeout(() => {
            onMessageHandler?.({
              data: {
                type: "ANALYZE_GUIDE",
                id: data.id,
                result: { canvasW: 800, canvasH: 1200, ogX: 100, ogY: 150 },
              },
            } as MessageEvent);
          }, 0);
        }
      } as unknown as typeof Worker;

      const { analyzeGuideInWorker: fn } = await import("./worker-client");

      const data = new Uint8ClampedArray(10 * 10 * 4);
      const result = await fn(data, 10, 10, 100, 100);

      expect(result).toEqual({
        canvasW: 800,
        canvasH: 1200,
        ogX: 100,
        ogY: 150,
      });

      globalThis.Worker = originalWorker;
    });
  });

  describe("removeWatermarkInWorker", () => {
    it("falls back to main-thread execution when Worker is unavailable", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      // Use a tiny 2x2 image to keep the test fast
      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 128;
        pixels[i + 1] = 128;
        pixels[i + 2] = 128;
        pixels[i + 3] = 255;
      }

      const result = await fn(pixels, 2, 2);

      expect(result.pixels).toBeInstanceOf(Uint8ClampedArray);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.metadata).toHaveProperty("confidence");
      expect(result.metadata).toHaveProperty("source");

      globalThis.Worker = originalWorker;
    });

    it("uses worker when available and resolves with removal result", async () => {
      const originalWorker = globalThis.Worker;
      let onMessageHandler: ((e: MessageEvent) => void) | null = null;

      globalThis.Worker = class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        constructor() {
          setTimeout(() => {
            onMessageHandler = this.onmessage;
          }, 0);
        }
        postMessage(data: { type: string; id: number }) {
          const resultPixels = new Uint8ClampedArray(2 * 2 * 4);
          setTimeout(() => {
            onMessageHandler?.({
              data: {
                type: "REMOVE_WATERMARK",
                id: data.id,
                pixels: resultPixels,
                width: 2,
                height: 2,
                metadata: {
                  corner: "bottom-right",
                  confidence: 0.9,
                  alphaGain: 1.05,
                  source: "adaptive",
                },
              },
            } as MessageEvent);
          }, 0);
        }
      } as unknown as typeof Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      const result = await fn(pixels, 2, 2);

      expect(result.pixels).toBeInstanceOf(Uint8ClampedArray);
      expect(result.metadata).toEqual({
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.05,
        source: "adaptive",
      });

      globalThis.Worker = originalWorker;
    });
  });
});
