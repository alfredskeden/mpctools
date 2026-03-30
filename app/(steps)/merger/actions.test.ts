import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/watermark-pipeline", () => ({ runWatermarkPipeline: vi.fn() }));

import { runWatermarkPipeline } from "@/lib/watermark-pipeline";
import { removeMergerWatermark } from "./actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const PNG_BYTES = new Uint8Array([137, 80, 78, 71]);
const DEFAULT_PIPELINE_OUTPUT = {
  pngBytes: PNG_BYTES,
  corner: "bottom-right",
  confidence: 0.87,
  alphaGain: 1.1,
  source: "adaptive" as const,
  accepted: true,
};

function makeFile(content = "fake-image-data"): File {
  return new File([content], "test.png", { type: "image/png" });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("removeMergerWatermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runWatermarkPipeline).mockResolvedValue(DEFAULT_PIPELINE_OUTPUT);
  });

  describe("pipeline invocation", () => {
    it("reads file to buffer and passes to runWatermarkPipeline", async () => {
      // Given
      const file = makeFile();

      // When
      await removeMergerWatermark(file);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledOnce();
      const [buffer] = vi.mocked(runWatermarkPipeline).mock.calls[0];
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it("passes adaptive=false by default", async () => {
      // Given
      const file = makeFile();

      // When
      await removeMergerWatermark(file);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adaptive: false }),
      );
    });

    it("passes adaptive=true when specified", async () => {
      // Given
      const file = makeFile();

      // When
      await removeMergerWatermark(file, { adaptive: true });

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adaptive: true }),
      );
    });
  });

  describe("result shape", () => {
    it("returns WatermarkActionResult with all fields from pipeline output", async () => {
      // Given
      const file = makeFile();

      // When
      const result = await removeMergerWatermark(file);

      // Then
      expect(result.pngBytes).toBe(PNG_BYTES);
      expect(result.corner).toBe("bottom-right");
      expect(result.confidence).toBe(0.87);
      expect(result.alphaGain).toBe(1.1);
      expect(result.source).toBe("adaptive");
      expect(result.accepted).toBe(true);
    });
  });

  describe("error propagation", () => {
    it("propagates errors from runWatermarkPipeline", async () => {
      // Given
      vi.mocked(runWatermarkPipeline).mockRejectedValue(new Error("pipeline failed"));
      const file = makeFile();

      // When / Then
      await expect(removeMergerWatermark(file)).rejects.toThrow("pipeline failed");
    });
  });
});
