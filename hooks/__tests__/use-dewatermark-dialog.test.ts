import { renderHook, act } from "@testing-library/react";

const mockRemoveWatermark = vi.fn();
const mockRemoveWatermarkFromPixels = vi.fn();
vi.mock("@/lib/watermark-api", () => ({
  removeWatermark: (...args: unknown[]) => mockRemoveWatermark(...args),
  removeWatermarkFromPixels: (...args: unknown[]) => mockRemoveWatermarkFromPixels(...args),
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { track } from "@/lib/analytics";
import { useDewatermarkDialog } from "@/hooks/use-dewatermark-dialog";

const mockCreateObjectURL = vi.fn(() => "blob:preview-url");
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal("URL", {
  ...globalThis.URL,
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeBlob() {
  return new Blob(["fake-png"], { type: "image/png" });
}

function makePixelData() {
  return {
    pixels: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100,
  };
}

function makeResult(overrides: Record<string, unknown> = {}) {
  return {
    blob: makeBlob(),
    metadata: {
      corner: "bottom-right",
      confidence: 0.87,
      alphaGain: 1.05,
      source: "adaptive",
    },
    pixelData: makePixelData(),
    ...overrides,
  };
}

describe("useDewatermarkDialog", () => {
  it("starts in idle phase", () => {
    // When
    const { result } = renderHook(() => useDewatermarkDialog());

    // Then
    expect(result.current.state.phase).toBe("idle");
  });

  it("transitions to processing then result on success", async () => {
    // Given
    const apiResult = makeResult();
    mockRemoveWatermark.mockResolvedValue(apiResult);
    const { result } = renderHook(() => useDewatermarkDialog());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.processFile(file);
    });

    // Then
    expect(result.current.state.phase).toBe("result");
    if (result.current.state.phase === "result") {
      expect(result.current.state.previewUrl).toBe("blob:preview-url");
      expect(result.current.state.metadata).toEqual(apiResult.metadata);
      expect(result.current.state.blob).toBe(apiResult.blob);
    }
  });

  it("transitions to error on API failure", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue(new Error("Failed to decode image"));
    const { result } = renderHook(() => useDewatermarkDialog());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.processFile(file);
    });

    // Then
    expect(result.current.state.phase).toBe("error");
    if (result.current.state.phase === "error") {
      expect(result.current.state.message).toBe("Failed to decode image");
    }
  });

  it("creates object URL from blob on success", async () => {
    // Given
    const apiResult = makeResult();
    mockRemoveWatermark.mockResolvedValue(apiResult);
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(mockCreateObjectURL).toHaveBeenCalledWith(apiResult.blob);
  });

  it("reset returns to idle and revokes object URL", async () => {
    // Given
    mockRemoveWatermark.mockResolvedValue(makeResult());
    const { result } = renderHook(() => useDewatermarkDialog());

    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });
    expect(result.current.state.phase).toBe("result");

    // When
    act(() => {
      result.current.reset();
    });

    // Then
    expect(result.current.state.phase).toBe("idle");
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:preview-url");
  });

  it("reset from idle does not revoke anything", () => {
    // Given
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    act(() => {
      result.current.reset();
    });

    // Then
    expect(result.current.state.phase).toBe("idle");
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  });

  it("passes abort signal to removeWatermark", async () => {
    // Given
    mockRemoveWatermark.mockResolvedValue(makeResult());
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(mockRemoveWatermark).toHaveBeenCalledWith(
      expect.any(File),
      expect.any(AbortSignal),
    );
  });

  it("does not transition to result if aborted", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(result.current.state.phase).toBe("idle");
  });

  it("tracks dewatermark_started on processFile", async () => {
    // Given
    mockRemoveWatermark.mockResolvedValue(makeResult());
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_started", {
      fileName: "outpaint.png",
    });
  });

  it("tracks dewatermark_succeeded on success", async () => {
    // Given
    mockRemoveWatermark.mockResolvedValue(makeResult());
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_succeeded", {
      corner: "bottom-right",
      confidence: 0.87,
    });
  });

  it("tracks dewatermark_failed on error", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue(new Error("decode failure"));
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_failed", {
      error: "decode failure",
    });
  });

  it("handles non-Error rejection with fallback message", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue("string error");
    const { result } = renderHook(() => useDewatermarkDialog());

    // When
    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // Then
    expect(result.current.state.phase).toBe("error");
    if (result.current.state.phase === "error") {
      expect(result.current.state.message).toBe("Unknown error");
    }
  });

  describe("runAdaptiveDetection", () => {
    it("transitions to processing then result with adaptive metadata", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult({
        metadata: { corner: "", confidence: 0.74, alphaGain: 1, source: "preset" },
      }));
      const adaptiveResult = makeResult({
        metadata: { corner: "bottom-right", confidence: 0.92, alphaGain: 1.1, source: "adaptive" },
      });
      mockRemoveWatermarkFromPixels.mockResolvedValue(adaptiveResult);

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });
      expect(result.current.state.phase).toBe("result");

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(result.current.state.phase).toBe("result");
      if (result.current.state.phase === "result") {
        expect(result.current.state.metadata).toEqual(adaptiveResult.metadata);
      }
    });

    it("calls removeWatermarkFromPixels with adaptive true", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockResolvedValue(makeResult());

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(mockRemoveWatermarkFromPixels).toHaveBeenCalledWith(
        expect.any(Uint8ClampedArray),
        100,
        100,
        { adaptive: true },
      );
    });

    it("is a no-op when not in result phase", async () => {
      // Given
      const { result } = renderHook(() => useDewatermarkDialog());

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(result.current.state.phase).toBe("idle");
      expect(mockRemoveWatermarkFromPixels).not.toHaveBeenCalled();
    });

    it("revokes previous preview URL before setting new one", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      let callCount = 0;
      mockCreateObjectURL.mockImplementation(() => {
        callCount++;
        return `blob:preview-url-${callCount}`;
      });
      mockRemoveWatermarkFromPixels.mockResolvedValue(makeResult());

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:preview-url-1");
    });

    it("tracks dewatermark_adaptive_started", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockResolvedValue(makeResult());

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_adaptive_started");
    });

    it("tracks dewatermark_adaptive_succeeded on success", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockResolvedValue(makeResult({
        metadata: { corner: "top-left", confidence: 0.95, alphaGain: 1.2, source: "adaptive" },
      }));

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_adaptive_succeeded", {
        corner: "top-left",
        confidence: 0.95,
      });
    });

    it("transitions to error on failure", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockRejectedValue(new Error("Detection failed"));

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(result.current.state.phase).toBe("error");
      if (result.current.state.phase === "error") {
        expect(result.current.state.message).toBe("Detection failed");
      }
    });

    it("tracks dewatermark_adaptive_failed on error", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockRejectedValue(new Error("Detection failed"));

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(vi.mocked(track)).toHaveBeenCalledWith("dewatermark_adaptive_failed", {
        error: "Detection failed",
      });
    });

    it("resets to idle on abort during adaptive detection", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockRejectedValue(
        new DOMException("Aborted", "AbortError"),
      );

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(result.current.state.phase).toBe("idle");
    });

    it("handles non-Error rejection with fallback message", async () => {
      // Given
      mockRemoveWatermark.mockResolvedValue(makeResult());
      mockRemoveWatermarkFromPixels.mockRejectedValue("string error");

      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When
      await act(async () => {
        result.current.runAdaptiveDetection();
      });

      // Then
      expect(result.current.state.phase).toBe("error");
      if (result.current.state.phase === "error") {
        expect(result.current.state.message).toBe("Unknown error");
      }
    });
  });

  it("acceptResult creates HTMLImageElement from preview URL", async () => {
    // Given
    const OriginalImage = globalThis.Image;
    vi.stubGlobal("Image", class MockImage {
      src = "";
      naturalWidth = 1024;
      naturalHeight = 1536;
      onload: (() => void) | null = null;

      constructor() {
        setTimeout(() => this.onload?.(), 0);
      }
    });

    mockRemoveWatermark.mockResolvedValue(makeResult());
    const { result } = renderHook(() => useDewatermarkDialog());

    await act(async () => {
      result.current.processFile(
        new File(["pixels"], "outpaint.png", { type: "image/png" }),
      );
    });

    // When
    let accepted: { image: unknown; fileName: string; fileSize: number } | undefined;
    await act(async () => {
      accepted = await result.current.acceptResult();
    });

    // Then
    expect(accepted).toBeDefined();
    expect(accepted!.fileName).toMatch(/^dewatermarked_\d+\.png$/);
    expect(accepted!.fileSize).toBeGreaterThan(0);

    vi.stubGlobal("Image", OriginalImage);
  });

  it("acceptResult throws when not in result phase", async () => {
    // Given
    const { result } = renderHook(() => useDewatermarkDialog());

    // When / Then
    await expect(result.current.acceptResult()).rejects.toThrow();
  });

  it("acceptResult rejects when image fails to load", async () => {
    // Given
    const OriginalImage = globalThis.Image;
    vi.stubGlobal("Image", class MockImage {
      src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        setTimeout(() => this.onerror?.(), 0);
      }
    });

    try {
      mockRemoveWatermark.mockResolvedValue(makeResult());
      const { result } = renderHook(() => useDewatermarkDialog());

      await act(async () => {
        result.current.processFile(
          new File(["pixels"], "outpaint.png", { type: "image/png" }),
        );
      });

      // When / Then
      await expect(
        act(async () => {
          await result.current.acceptResult();
        }),
      ).rejects.toThrow("Failed to load image");
    } finally {
      vi.stubGlobal("Image", OriginalImage);
    }
  });
});
