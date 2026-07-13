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
    it("falls back to preset path when Worker is unavailable and adaptive is not set", async () => {
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
      expect(result.metadata.source).toBe("preset");

      globalThis.Worker = originalWorker;
    });

    it("falls back to adaptive path when Worker is unavailable and adaptive is true", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 128;
        pixels[i + 1] = 128;
        pixels[i + 2] = 128;
        pixels[i + 3] = 255;
      }

      const result = await fn(pixels, 2, 2, true);

      expect(result.pixels).toBeInstanceOf(Uint8ClampedArray);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.metadata).toHaveProperty("confidence");
      expect(result.metadata).toHaveProperty("source");

      globalThis.Worker = originalWorker;
    });

    it("forwards options object (adaptive + settings + threshold) to worker payload", async () => {
      const originalWorker = globalThis.Worker;
      const captured: { settings?: unknown; confidenceThreshold?: unknown; adaptive?: unknown } = {};
      let onMessageHandler: ((e: MessageEvent) => void) | null = null;

      globalThis.Worker = class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        constructor() {
          setTimeout(() => {
            onMessageHandler = this.onmessage;
          }, 0);
        }
        postMessage(data: {
          type: string;
          id: number;
          settings?: unknown;
          confidenceThreshold?: unknown;
          adaptive?: unknown;
        }) {
          captured.settings = data.settings;
          captured.confidenceThreshold = data.confidenceThreshold;
          captured.adaptive = data.adaptive;
          const resultPixels = new Uint8ClampedArray(2 * 2 * 4);
          setTimeout(() => {
            onMessageHandler?.({
              data: {
                type: "REMOVE_WATERMARK",
                id: data.id,
                pixels: resultPixels,
                width: 2,
                height: 2,
                metadata: { corner: "top-left", confidence: 0.8, alphaGain: 1.2, source: "adaptive" },
              },
            } as MessageEvent);
          }, 0);
        }
      } as unknown as typeof Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      const settings = { corner: "top-left" as const, alphaGain: 1.2, feather: 0.3, postLightness: 0, maskExpand: 5 };
      await fn(pixels, 2, 2, { adaptive: true, settings, confidenceThreshold: 0.6 });

      expect(captured.adaptive).toBe(true);
      expect(captured.settings).toEqual(settings);
      expect(captured.confidenceThreshold).toBe(0.6);

      globalThis.Worker = originalWorker;
    });

    it("falls back honouring confidenceThreshold when worker is unavailable", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      // Adaptive on with an impossibly high threshold → detection (if any) gets dropped → preset source
      const result = await fn(pixels, 2, 2, { adaptive: true, confidenceThreshold: 1.5 });

      expect(result.metadata.source).toBe("preset");

      globalThis.Worker = originalWorker;
    });

    it("drops a non-null fallback detection when confidence is below the threshold", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      vi.doMock("./watermark-detection", async (importOriginal) => {
        const actual = await importOriginal<
          typeof import("./watermark-detection")
        >();
        return {
          ...actual,
          detectBestCandidate: vi.fn(() => ({
            corner: "bottom-right",
            confidence: 0.2,
            accepted: true,
            alphaGain: 1,
            position: { x: 0, y: 0, width: 2, height: 2 },
            alphaMap: new Float32Array(4),
          })),
        };
      });

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      const result = await fn(pixels, 2, 2, {
        adaptive: true,
        confidenceThreshold: 0.9,
      });

      // detection.confidence (0.2) < threshold (0.9) → detection gets nulled → preset path
      expect(result.metadata.source).toBe("preset");

      vi.doUnmock("./watermark-detection");
      globalThis.Worker = originalWorker;
    });

    it("falls back forwarding custom settings when worker is unavailable", async () => {
      const originalWorker = globalThis.Worker;
      // @ts-expect-error - intentionally removing Worker
      delete globalThis.Worker;

      const { removeWatermarkInWorker: fn } = await import("./worker-client");

      const pixels = new Uint8ClampedArray(2 * 2 * 4);
      const result = await fn(pixels, 2, 2, {
        settings: { corner: "top-right", alphaGain: 1.3 },
      });

      expect(result.pixels).toBeInstanceOf(Uint8ClampedArray);
      expect(result.metadata.source).toBe("preset");

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
