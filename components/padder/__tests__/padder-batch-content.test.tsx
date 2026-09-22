import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PadderBatchContent } from "../padder-batch-content";
import { PAD_TARGETS } from "@/lib/padder-math";

const padBatchFilesMock = vi.fn();
vi.mock("@/lib/padder-batch", () => ({
  padBatchFiles: (...args: unknown[]) => padBatchFilesMock(...args),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

function makeFile(name: string): File {
  return new File(["x"], name, { type: "image/png" });
}

function fileListOf(...files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
}

beforeEach(() => padBatchFilesMock.mockReset());

describe("PadderBatchContent", () => {
  it("renders the drop zone, and the run button starts disabled with no files", () => {
    // Given / When
    render(<PadderBatchContent target={PAD_TARGETS[0]} />);

    // Then
    expect(screen.getByTestId("batch-drop-zone")).toBeDefined();
    expect(screen.getByTestId("batch-run-btn")).toHaveProperty("disabled", true);
  });

  it("lists dropped scans as rows and enables the run button", async () => {
    // Given
    render(<PadderBatchContent target={PAD_TARGETS[0]} />);

    // When
    fireEvent.drop(screen.getByTestId("batch-drop-zone"), {
      dataTransfer: { files: fileListOf(makeFile("a.png"), makeFile("b.png")) },
    });

    // Then
    await waitFor(() =>
      expect(screen.getAllByTestId("batch-row")).toHaveLength(2),
    );
    expect(screen.getByTestId("batch-run-btn")).toHaveProperty("disabled", false);
  });

  it("runs the batch through the injected loop when the run button is clicked", async () => {
    // Given
    padBatchFilesMock.mockResolvedValue({ entries: [], failures: [] });
    render(<PadderBatchContent target={PAD_TARGETS[0]} />);
    fireEvent.drop(screen.getByTestId("batch-drop-zone"), {
      dataTransfer: { files: fileListOf(makeFile("a.png")) },
    });
    await waitFor(() => expect(screen.getAllByTestId("batch-row")).toHaveLength(1));

    // When
    fireEvent.click(screen.getByTestId("batch-run-btn"));

    // Then
    await waitFor(() => expect(padBatchFilesMock).toHaveBeenCalledOnce());
    expect(padBatchFilesMock.mock.calls[0][1]).toBe(PAD_TARGETS[0]);
  });
});
