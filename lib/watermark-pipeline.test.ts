import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("sharp");
vi.mock("@/lib/watermark-detection", () => ({ detectBestCandidate: vi.fn() }));
vi.mock("@/lib/watermark-removal", () => ({ runPipeline: vi.fn() }));

import sharp from "sharp";
import { detectBestCandidate } from "@/lib/watermark-detection";
import { runPipeline } from "@/lib/watermark-removal";
import { runWatermarkPipeline } from "@/lib/watermark-pipeline";

// ─── Constants ────────────────────────────────────────────────────────────────

const DECODED_DATA = Buffer.alloc(4 * 10 * 10);
const DECODED_INFO = { width: 10, height: 10, channels: 4 };
const PNG_BYTES = Buffer.from([137, 80, 78, 71]);
const DEFAULT_PIPELINE_RESULT = {
  imageData: { data: new Uint8ClampedArray(4 * 10 * 10), width: 10, height: 10 },
  alphaMap: new Float32Array(100),
  alphaGain: 1.1,
  confidence: 0.87,
  accepted: true,
  detectionSource: "adaptive" as const,
  position: { x: 0, y: 0, width: 10, height: 10 },
};

// ─── Sharp helpers ────────────────────────────────────────────────────────────

function createDecodeInstance(error?: Error) {
  const inst = { ensureAlpha: vi.fn(), raw: vi.fn(), toBuffer: vi.fn() };
  inst.ensureAlpha.mockReturnValue(inst);
  inst.raw.mockReturnValue(inst);
  if (error) {
    inst.toBuffer.mockRejectedValue(error);
  } else {
    inst.toBuffer.mockResolvedValue({ data: DECODED_DATA, info: DECODED_INFO });
  }
  return inst;
}

function createEncodeInstance(error?: Error) {
  const inst = { png: vi.fn(), toBuffer: vi.fn() };
  inst.png.mockReturnValue(inst);
  if (error) {
    inst.toBuffer.mockRejectedValue(error);
  } else {
    inst.toBuffer.mockResolvedValue(PNG_BYTES);
  }
  return inst;
}

function setupSharp({ decodeError, encodeError }: { decodeError?: Error; encodeError?: Error } = {}) {
  vi.mocked(sharp).mockReset();
  vi.mocked(sharp)
    .mockReturnValueOnce(createDecodeInstance(decodeError) as unknown as ReturnType<typeof sharp>)
    .mockReturnValueOnce(createEncodeInstance(encodeError) as unknown as ReturnType<typeof sharp>);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("runWatermarkPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSharp();
    vi.mocked(detectBestCandidate).mockReturnValue(
      { corner: "bottom-right" } as ReturnType<typeof detectBestCandidate>,
    );
    vi.mocked(runPipeline).mockReturnValue(DEFAULT_PIPELINE_RESULT);
  });

  describe("image decoding", () => {
    it("decodes the image buffer with sharp ensureAlpha and raw", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer);

      // Then
      const decodeCall = vi.mocked(sharp).mock.calls[0];
      expect(decodeCall[0]).toBe(imageBuffer);
    });

    it("throws when sharp cannot decode the image", async () => {
      // Given
      setupSharp({ decodeError: new Error("unsupported format") });
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When / Then
      await expect(runWatermarkPipeline(imageBuffer)).rejects.toThrow("unsupported format");
    });
  });

  describe("adaptive detection", () => {
    it("skips detectBestCandidate when adaptive is false (default)", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer);

      // Then
      expect(detectBestCandidate).not.toHaveBeenCalled();
      expect(runPipeline).toHaveBeenCalledWith(expect.anything(), expect.anything(), null);
    });

    it("calls detectBestCandidate when adaptive is true", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer, { adaptive: true });

      // Then
      expect(detectBestCandidate).toHaveBeenCalledOnce();
    });

    it("passes forcedVariant and corner to detectBestCandidate", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer, {
        adaptive: true,
        forcedVariant: "96",
        corner: "bottom-right",
      });

      // Then
      expect(detectBestCandidate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ forcedVariant: "96", corner: "bottom-right" }),
      );
    });

    it("defaults corner to 'auto' when not provided for detection", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer, { adaptive: true });

      // Then
      expect(detectBestCandidate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ corner: "auto" }),
      );
    });
  });

  describe("pipeline settings", () => {
    it("passes empty settings to runPipeline when no options are given", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer);

      // Then
      expect(runPipeline).toHaveBeenCalledWith(expect.anything(), {}, null);
    });

    it("passes all explicit settings through to runPipeline", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer, {
        alphaGain: 1.2,
        corner: "top-left",
      });

      // Then
      expect(runPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          alphaGain: 1.2,
          corner: "top-left",
        }),
        null,
      );
    });

    it("omits optional settings when not provided", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer);

      // Then
      const settings = vi.mocked(runPipeline).mock.calls[0][1] as Record<string, unknown>;
      expect(settings.alphaGain).toBeUndefined();
      expect(settings.edgeReveal).toBeUndefined();
      expect(settings.innerPunch).toBeUndefined();
      expect(settings.corner).toBeUndefined();
    });
  });

  describe("image encoding", () => {
    it("encodes the result image to PNG via sharp", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      await runWatermarkPipeline(imageBuffer);

      // Then
      const encodeCall = vi.mocked(sharp).mock.calls[1];
      expect(encodeCall[1]).toMatchObject({ raw: { width: 10, height: 10, channels: 4 } });
    });

    it("throws when sharp cannot encode the result", async () => {
      // Given
      setupSharp({ encodeError: new Error("encode error") });
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When / Then
      await expect(runWatermarkPipeline(imageBuffer)).rejects.toThrow("encode error");
    });
  });

  describe("output", () => {
    it("returns pngBytes as Uint8Array", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      const output = await runWatermarkPipeline(imageBuffer);

      // Then
      expect(output.pngBytes).toBeInstanceOf(Uint8Array);
      expect(output.pngBytes).toEqual(new Uint8Array(PNG_BYTES));
    });

    it("returns metadata from pipeline result", async () => {
      // Given
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      const output = await runWatermarkPipeline(imageBuffer);

      // Then
      expect(output.confidence).toBe(0.87);
      expect(output.alphaGain).toBe(1.1);
      expect(output.source).toBe("adaptive");
      expect(output.accepted).toBe(true);
    });

    it("populates corner when result was accepted and detection ran", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: true });
      vi.mocked(detectBestCandidate).mockReturnValue(
        { corner: "bottom-right" } as ReturnType<typeof detectBestCandidate>,
      );
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      const output = await runWatermarkPipeline(imageBuffer, { adaptive: true });

      // Then
      expect(output.corner).toBe("bottom-right");
    });

    it("returns empty corner when result was not accepted", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: false });
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      const output = await runWatermarkPipeline(imageBuffer, { adaptive: true });

      // Then
      expect(output.corner).toBe("");
    });

    it("returns empty corner when no detection ran (adaptive=false)", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: true });
      const imageBuffer = Buffer.from([1, 2, 3, 4]);

      // When
      const output = await runWatermarkPipeline(imageBuffer);

      // Then
      expect(output.corner).toBe("");
    });
  });
});
