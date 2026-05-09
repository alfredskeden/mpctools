import { renderHook, act, waitFor } from "@testing-library/react";

import {
  DEWATERMARK_DEFAULTS,
  toRemovalSettings,
  useDewatermarkWorkspace,
  type DewatermarkRunner,
  type DewatermarkRunOptions,
  type ImageDecoder,
} from "@/hooks/use-dewatermark-workspace";
import type { WatermarkResult } from "@/lib/watermark-api";

function makeResult(overrides: Partial<WatermarkResult["metadata"]> = {}): WatermarkResult {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
    metadata: {
      corner: "bottom-right",
      confidence: 0.9,
      alphaGain: 1.05,
      source: "adaptive",
      ...overrides,
    },
    pixelData: {
      pixels: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    },
  };
}

const fakeDecoder: ImageDecoder = async () => ({
  pixels: new Uint8ClampedArray(2 * 2 * 4),
  width: 2,
  height: 2,
});

function makeFile(name = "card.png", size = 1024) {
  const file = new File([new Uint8Array(8)], name, { type: "image/png" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("toRemovalSettings", () => {
  it("maps the auto/tl/tr/bl/br shorthand to the watermark-removal corner names", () => {
    const map = (
      ["auto", "tl", "tr", "bl", "br"] as const
    ).map((c) => ({
      input: c,
      mapped: toRemovalSettings({ ...DEWATERMARK_DEFAULTS, corner: c }).corner,
    }));
    expect(map).toEqual([
      { input: "auto", mapped: "auto" },
      { input: "tl", mapped: "top-left" },
      { input: "tr", mapped: "top-right" },
      { input: "bl", mapped: "bottom-left" },
      { input: "br", mapped: "bottom-right" },
    ]);
  });

  it("forwards every numeric repair value verbatim", () => {
    const out = toRemovalSettings({
      ...DEWATERMARK_DEFAULTS,
      alphaGain: 1.4,
      feather: 0.66,
      postLightness: -0.3,
      maskExpand: 12,
    });
    expect(out).toMatchObject({
      alphaGain: 1.4,
      feather: 0.66,
      postLightness: -0.3,
      maskExpand: 12,
    });
  });
});

describe("useDewatermarkWorkspace", () => {
  it("starts with no image and default settings", () => {
    // When
    const { result } = renderHook(() => useDewatermarkWorkspace());

    // Then
    expect(result.current.image).toBeNull();
    expect(result.current.settings).toEqual(DEWATERMARK_DEFAULTS);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("decodes the file, runs the initial pipeline, exposes result blob and metadata", async () => {
    // Given
    const runner = vi.fn<DewatermarkRunner>(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );

    // When
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));

    // Then
    expect(result.current.image).toEqual({
      name: "card.png",
      size: 1024,
      width: 2,
      height: 2,
    });
    expect(runner).toHaveBeenCalledOnce();
    expect(result.current.detection?.source).toBe("adaptive");
    expect(result.current.getResultBlob()).toBeInstanceOf(Blob);
    expect(result.current.resultRevision).toBe(1);
  });

  it("ignores non-image files", async () => {
    // Given
    const runner = vi.fn(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder }),
    );
    const txt = new File(["x"], "note.txt", { type: "text/plain" });

    // When
    await act(async () => {
      await result.current.acceptFile(txt);
    });

    // Then
    expect(result.current.image).toBeNull();
    expect(runner).not.toHaveBeenCalled();
  });

  it("debounces rapid setting patches into a single pipeline run", async () => {
    // Given
    const runner = vi.fn<DewatermarkRunner>(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 30 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    runner.mockClear();

    // When
    act(() => {
      result.current.patch({ alphaGain: 1.1 });
      result.current.patch({ alphaGain: 1.2 });
      result.current.patch({ alphaGain: 1.3 });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isProcessing).toBe(false));

    // Then
    expect(runner.mock.calls[0]?.[0].settings.alphaGain).toBe(1.3);
    expect(result.current.committedSettings.alphaGain).toBe(1.3);
  });

  it("ignores a stale .then() resolution when a newer run has bumped runIdRef", async () => {
    // Given
    let firstResolve: ((v: ReturnType<typeof makeResult>) => void) | null = null;
    const firstPromise = new Promise<ReturnType<typeof makeResult>>((resolve) => {
      firstResolve = resolve;
    });
    let callIndex = 0;
    const runner = vi.fn(async (opts: DewatermarkRunOptions) => {
      callIndex += 1;
      if (callIndex === 1) {
        // Hang then resolve successfully on demand (no abort throw)
        return firstPromise;
      }
      return makeResult({ alphaGain: opts.settings.alphaGain });
    });
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 0 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    runner.mockClear();
    callIndex = 0;

    // When
    act(() => {
      result.current.patch({ alphaGain: 1.5 });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.patch({ alphaGain: 1.7 });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(2));
    // Resolve the FIRST run with success — its .then fires after run 2 already won
    act(() => {
      firstResolve?.(makeResult({ alphaGain: 1.5 }));
    });
    await waitFor(() =>
      expect(result.current.committedSettings.alphaGain).toBe(1.7),
    );

    // Then — committed stays at 1.7 even though run 1's .then fired late with 1.5
    expect(result.current.committedSettings.alphaGain).toBe(1.7);
  });

  it("aborts a stale pipeline run when newer settings arrive mid-flight", async () => {
    // Given
    let firstResolve: (() => void) | null = null;
    const firstPromise = new Promise<void>((resolve) => {
      firstResolve = resolve;
    });
    const runner = vi.fn(async (opts: DewatermarkRunOptions) => {
      if (runner.mock.calls.length === 1) {
        await firstPromise;
        if (opts.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
      }
      return makeResult({ alphaGain: opts.settings.alphaGain });
    });
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 0 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    runner.mockClear();

    // When — first patch starts a run that hangs; second patch supersedes it
    act(() => {
      result.current.patch({ alphaGain: 1.5 });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.patch({ alphaGain: 1.7 });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(2));
    act(() => {
      firstResolve?.();
    });
    await waitFor(() =>
      expect(result.current.committedSettings.alphaGain).toBe(1.7),
    );

    // Then — the late-resolving stale call MUST NOT overwrite committed state
    expect(result.current.committedSettings.alphaGain).toBe(1.7);
    expect(result.current.detection?.alphaGain).toBe(1.7);
  });

  it("commits export-format-only changes immediately without re-running the pipeline", async () => {
    // Given
    const runner = vi.fn(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    runner.mockClear();

    // When
    act(() => {
      result.current.patch({ exportFormat: "jpeg" });
    });

    // Then
    await waitFor(() =>
      expect(result.current.committedSettings.exportFormat).toBe("jpeg"),
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("dispatches RUN_FAILED with the error message on rejection", async () => {
    // Given
    const runner = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue(makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );

    // When
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.error).toBe("boom"));

    // Then
    expect(result.current.isProcessing).toBe(false);
  });

  it("falls back to 'Unknown error' when a non-Error rejection bubbles up", async () => {
    // Given
    const runner = vi.fn().mockRejectedValueOnce("nope");
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );

    // When
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.error).toBe("Unknown error"));

    // Then
    expect(result.current.isProcessing).toBe(false);
  });

  it("reset returns settings to defaults but keeps the loaded image", async () => {
    // Given
    const runner = vi.fn(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    act(() => {
      result.current.patch({ adaptive: true, alphaGain: 1.6 });
    });
    await waitFor(() => expect(result.current.isDirty).toBe(true));

    // When
    act(() => {
      result.current.reset();
    });
    await waitFor(() => expect(result.current.isDirty).toBe(false));

    // Then
    expect(result.current.image).not.toBeNull();
    expect(result.current.settings).toEqual(DEWATERMARK_DEFAULTS);
  });

  it("clear cancels a pending debounced run", async () => {
    // Given
    const runner = vi.fn<DewatermarkRunner>(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 50 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    runner.mockClear();
    act(() => {
      result.current.patch({ alphaGain: 1.5 });
    });

    // When — clear before the debounce fires
    act(() => {
      result.current.clear();
    });
    // Wait past the debounce window
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Then
    expect(runner).not.toHaveBeenCalled();
    expect(result.current.image).toBeNull();
  });

  it("clear unloads the image and forgets cached pixels and result blob", async () => {
    // Given
    const runner = vi.fn(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.getResultBlob()).not.toBeNull());

    // When
    act(() => {
      result.current.clear();
    });

    // Then
    expect(result.current.image).toBeNull();
    expect(result.current.getResultBlob()).toBeNull();
    expect(result.current.getOriginalPixels()).toBeNull();
    expect(result.current.getDimensions()).toBeNull();
  });

  it("swallows AbortError without dispatching RUN_FAILED", async () => {
    // Given
    const runner = vi
      .fn<DewatermarkRunner>()
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
      .mockImplementation(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 5 }),
    );

    // When
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    // Wait for the rejection to settle: error stays null because AbortError is swallowed
    await waitFor(() => expect(result.current.isProcessing).toBe(false));

    // Then
    expect(result.current.error).toBeNull();
  });

  it("clears a pending debounced run when a new file is uploaded mid-debounce", async () => {
    // Given
    const runner = vi.fn<DewatermarkRunner>(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 50 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile("first.png"));
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    runner.mockClear();

    // When — patch (queues debounce), then immediately re-upload before debounce fires
    act(() => {
      result.current.patch({ alphaGain: 1.5 });
    });
    await act(async () => {
      await result.current.acceptFile(makeFile("second.png"));
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));

    // Then — only the upload-driven run executes; the debounced one is cleared
    expect(runner).toHaveBeenCalledTimes(1);
    expect(result.current.image?.name).toBe("second.png");
  });

  it("forwards the corner choice to the runner", async () => {
    // Given
    const runner = vi.fn<DewatermarkRunner>(async () => makeResult());
    const { result } = renderHook(() =>
      useDewatermarkWorkspace({ runner, decoder: fakeDecoder, debounceMs: 0 }),
    );
    await act(async () => {
      await result.current.acceptFile(makeFile());
    });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    runner.mockClear();

    // When
    act(() => {
      result.current.patch({ corner: "tl" });
    });
    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1));

    // Then
    expect(runner.mock.calls[0]?.[0].settings.corner).toBe("tl");
  });
});
