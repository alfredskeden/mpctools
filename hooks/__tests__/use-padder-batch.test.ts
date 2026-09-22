import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const padBatchFilesMock = vi.fn();
const buildZipBlobMock = vi.fn();
const downloadZipBlobMock = vi.fn();
const trackMock = vi.fn();

vi.mock("@/lib/padder-batch", () => ({
  padBatchFiles: (...args: unknown[]) => padBatchFilesMock(...args),
}));
vi.mock("@/lib/zip-download", () => ({
  buildZipBlob: (...args: unknown[]) => buildZipBlobMock(...args),
  downloadZipBlob: (...args: unknown[]) => downloadZipBlobMock(...args),
}));
vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

import { usePadderBatch, BATCH_ZIP_NAME, padderBatchReducer } from "@/hooks/use-padder-batch";
import { PAD_TARGETS } from "@/lib/padder-math";
import type { BatchResult } from "@/lib/padder-batch";

const TARGET = PAD_TARGETS[0];

function makeFile(name: string, type = "image/png", size = 10): File {
  const file = new File(["x".repeat(size)], name, { type });
  return file;
}

function successResult(name: string): BatchResult {
  return {
    status: "success",
    name,
    blob: new Blob(["png"]),
    layout: {
      target: TARGET,
      canvas: { width: 816, height: 1110 },
      x: 0,
      y: 0,
      image: { width: 745, height: 1040 },
      croppedPixels: 4,
    },
  };
}

beforeEach(() => {
  padBatchFilesMock.mockReset();
  buildZipBlobMock.mockReset();
  downloadZipBlobMock.mockReset();
  trackMock.mockReset();
});

describe("usePadderBatch", () => {
  it("records selected files as pending rows without processing them", () => {
    // Given
    const { result } = renderHook(() => usePadderBatch(TARGET));

    // When
    act(() => result.current.addFiles([makeFile("a.png"), makeFile("b.png")]));

    // Then
    expect(result.current.rows.map((r) => r.name)).toEqual(["a.png", "b.png"]);
    expect(result.current.rows.every((r) => r.status === "pending")).toBe(true);
    expect(result.current.hasFiles).toBe(true);
    expect(result.current.canRun).toBe(true);
    expect(padBatchFilesMock).not.toHaveBeenCalled();
  });

  it("does nothing when run is called with no files", async () => {
    // Given
    const { result } = renderHook(() => usePadderBatch(TARGET));

    // When
    await act(async () => {
      await result.current.run();
    });

    // Then
    expect(padBatchFilesMock).not.toHaveBeenCalled();
    expect(result.current.canRun).toBe(false);
  });

  it("streams per-file results into rows and finishes in the done phase", async () => {
    // Given
    padBatchFilesMock.mockImplementation(async (_files, _target, options) => {
      options.onResult(successResult("a.png"), 0);
      options.onProgress({ processed: 1, total: 2, current: "a.png" });
      options.onResult({ status: "failed", name: "wide.png", reason: "not-portrait" }, 1);
      options.onProgress({ processed: 2, total: 2, current: "wide.png" });
      return { entries: [{ name: "padded_a.png", input: new Blob() }], failures: [{ status: "failed", name: "wide.png", reason: "not-portrait" }] };
    });
    const { result } = renderHook(() => usePadderBatch(TARGET));
    act(() => result.current.addFiles([makeFile("a.png"), makeFile("wide.png")]));

    // When
    await act(async () => {
      await result.current.run();
    });

    // Then
    expect(result.current.rows[0].status).toBe("success");
    expect(result.current.rows[0].canvasWidth).toBe(816);
    expect(result.current.rows[0].cropPixels).toBe(4);
    expect(result.current.rows[1].status).toBe("failed");
    expect(result.current.rows[1].reason).toBe("not-portrait");
    expect(result.current.phase).toBe("done");
    expect(result.current.counts).toMatchObject({ total: 2, succeeded: 1, failed: 1, pending: 0 });
    expect(result.current.progress).toMatchObject({ processed: 2, total: 2, current: "wide.png" });
    expect(result.current.canDownload).toBe(true);
    expect(trackMock).toHaveBeenCalledWith("padder_batch_started", { count: 2 });
    expect(trackMock).toHaveBeenCalledWith("padder_batch_completed", { succeeded: 1, failed: 1 });
  });

  it("exposes a cancel that stops processing between files", async () => {
    // Given
    let capturedIsCancelled: (() => boolean) | undefined;
    padBatchFilesMock.mockImplementation(async (_files, _target, options) => {
      capturedIsCancelled = options.isCancelled;
      return { entries: [], failures: [] };
    });
    const { result } = renderHook(() => usePadderBatch(TARGET));
    act(() => result.current.addFiles([makeFile("a.png")]));

    // When
    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.cancel());

    // Then
    expect(capturedIsCancelled?.()).toBe(true);
  });

  it("builds and downloads a zip of the padded successes", async () => {
    // Given
    const zipBlob = new Blob(["zip"]);
    buildZipBlobMock.mockResolvedValue(zipBlob);
    padBatchFilesMock.mockResolvedValue({
      entries: [{ name: "padded_a.png", input: new Blob() }],
      failures: [],
    });
    // seed one success so entries exist
    padBatchFilesMock.mockImplementation(async (_files, _target, options) => {
      options.onResult(successResult("a.png"), 0);
      return { entries: [{ name: "padded_a.png", input: new Blob() }], failures: [] };
    });
    const { result } = renderHook(() => usePadderBatch(TARGET));
    act(() => result.current.addFiles([makeFile("a.png")]));
    await act(async () => {
      await result.current.run();
    });

    // When
    await act(async () => {
      await result.current.download();
    });

    // Then
    expect(buildZipBlobMock).toHaveBeenCalledOnce();
    expect(downloadZipBlobMock).toHaveBeenCalledWith(zipBlob, BATCH_ZIP_NAME);
    expect(trackMock).toHaveBeenCalledWith("padder_batch_downloaded", { count: 1 });
  });

  it("does not download when there are no successful entries", async () => {
    // Given
    const { result } = renderHook(() => usePadderBatch(TARGET));

    // When
    await act(async () => {
      await result.current.download();
    });

    // Then
    expect(buildZipBlobMock).not.toHaveBeenCalled();
    expect(downloadZipBlobMock).not.toHaveBeenCalled();
  });

  it("resets rows and files", async () => {
    // Given
    padBatchFilesMock.mockResolvedValue({ entries: [], failures: [] });
    const { result } = renderHook(() => usePadderBatch(TARGET));
    act(() => result.current.addFiles([makeFile("a.png")]));

    // When
    act(() => result.current.reset());

    // Then
    expect(result.current.rows).toEqual([]);
    expect(result.current.hasFiles).toBe(false);
  });
});

describe("padderBatchReducer", () => {
  it("returns the current state for an unknown action", () => {
    // Given
    const state = { rows: [], phase: "idle" as const, processed: 0, current: "" };

    // When
    const next = padderBatchReducer(state, { type: "UNKNOWN" } as never);

    // Then
    expect(next).toBe(state);
  });
});
