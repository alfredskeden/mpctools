import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DewatermarkPageContent } from "@/components/dewatermark/dewatermark-page-content";
import type {
  DewatermarkRunOptions,
  ImageDecoder,
} from "@/hooks/use-dewatermark-workspace";
import type { WatermarkResult } from "@/lib/watermark-api";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const fakeDecoder: ImageDecoder = async () => ({
  pixels: new Uint8ClampedArray(2 * 2 * 4),
  width: 2,
  height: 2,
});

const fakeRunner = vi.fn(async (_opts: DewatermarkRunOptions) => {
  const result: WatermarkResult = {
    blob: new Blob([new Uint8Array([1])], { type: "image/png" }),
    metadata: {
      corner: "bottom-right",
      confidence: 0.92,
      alphaGain: 1.05,
      source: "adaptive",
    },
    pixelData: { pixels: new Uint8ClampedArray(4), width: 2, height: 2 },
  };
  return result;
});

beforeEach(() => {
  fakeRunner.mockClear();
});

function makeFile(name = "x.png") {
  return new File(["x"], name, { type: "image/png" });
}

describe("DewatermarkPageContent", () => {
  it("shows the empty state initially", () => {
    // Given/When
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );

    // Then
    expect(screen.getByTestId("dewatermark-empty-card")).toBeDefined();
    expect(screen.queryByTestId("preview-grid")).toBeNull();
  });

  it("swaps to the preview pair after a file is uploaded via the empty state", async () => {
    // Given
    const user = userEvent.setup();
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );

    // When
    await user.upload(
      screen.getByTestId("dewatermark-file-input") as HTMLInputElement,
      makeFile(),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("preview-grid")).not.toBeNull(),
    );

    // Then
    expect(fakeRunner).toHaveBeenCalled();
    expect(screen.queryByTestId("dewatermark-empty-card")).toBeNull();
  });

  function dispatchDragEvent(type: string, dataTransfer?: { files: File[] }) {
    const evt = new Event(type, { bubbles: true, cancelable: true });
    if (dataTransfer) {
      Object.defineProperty(evt, "dataTransfer", { value: dataTransfer });
    }
    window.dispatchEvent(evt);
  }

  it("activates the global drag overlay on a window dragenter", async () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const overlay = screen.getByTestId("dewatermark-drag-overlay");

    // When
    act(() => {
      dispatchDragEvent("dragenter");
    });

    // Then
    expect(overlay.getAttribute("data-active")).toBe("true");
  });

  it("clears the drag overlay on dragleave", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const overlay = screen.getByTestId("dewatermark-drag-overlay");

    // When
    act(() => {
      dispatchDragEvent("dragenter");
      dispatchDragEvent("dragleave");
    });

    // Then
    expect(overlay.getAttribute("data-active")).toBe("false");
  });

  it("accepts a file dropped onto the window", async () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const file = makeFile("dropped.png");

    // When
    act(() => {
      dispatchDragEvent("drop", { files: [file] });
    });
    await waitFor(() =>
      expect(screen.queryByTestId("preview-grid")).not.toBeNull(),
    );

    // Then
    expect(fakeRunner).toHaveBeenCalled();
  });

  it("ignores a window drop with no files", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );

    // When
    act(() => {
      dispatchDragEvent("drop", { files: [] });
    });

    // Then
    expect(fakeRunner).not.toHaveBeenCalled();
    expect(screen.queryByTestId("preview-grid")).toBeNull();
  });

  it("ignores dragover and keeps overlay active mid-drag", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const overlay = screen.getByTestId("dewatermark-drag-overlay");

    // When
    act(() => {
      dispatchDragEvent("dragenter");
      dispatchDragEvent("dragover");
    });

    // Then
    expect(overlay.getAttribute("data-active")).toBe("true");
  });

  it("accepts a pasted image file from the clipboard", async () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const file = makeFile("pasted.png");
    const item = {
      kind: "file",
      type: "image/png",
      getAsFile: () => file,
    } as unknown as DataTransferItem;
    const evt = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "clipboardData", {
      value: { items: [item] },
    });

    // When
    act(() => {
      window.dispatchEvent(evt);
    });
    await waitFor(() =>
      expect(screen.queryByTestId("preview-grid")).not.toBeNull(),
    );

    // Then
    expect(fakeRunner).toHaveBeenCalled();
  });

  it("ignores paste events with no clipboard data", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const evt = new Event("paste", { bubbles: true, cancelable: true });

    // When
    act(() => {
      window.dispatchEvent(evt);
    });

    // Then
    expect(fakeRunner).not.toHaveBeenCalled();
  });

  it("keeps the overlay active when dragenter fires multiple times before a single dragleave", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const overlay = screen.getByTestId("dewatermark-drag-overlay");

    // When
    act(() => {
      dispatchDragEvent("dragenter");
      dispatchDragEvent("dragenter");
      dispatchDragEvent("dragleave");
    });

    // Then — counter still positive, overlay remains active
    expect(overlay.getAttribute("data-active")).toBe("true");
  });

  it("ignores a paste with a clipboard image item whose getAsFile returns null", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const evt = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "clipboardData", {
      value: {
        items: [
          { kind: "file", type: "image/png", getAsFile: () => null },
        ],
      },
    });

    // When
    act(() => {
      window.dispatchEvent(evt);
    });

    // Then
    expect(fakeRunner).not.toHaveBeenCalled();
  });

  it("ignores a window drop with no dataTransfer payload", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );

    // When — fire raw drop without a dataTransfer
    act(() => {
      const evt = new Event("drop", { bubbles: true, cancelable: true });
      window.dispatchEvent(evt);
    });

    // Then
    expect(fakeRunner).not.toHaveBeenCalled();
  });

  it("ignores paste events with non-image clipboard items", () => {
    // Given
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const evt = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "clipboardData", {
      value: {
        items: [
          { kind: "string", type: "text/plain", getAsFile: () => null },
        ],
      },
    });

    // When
    act(() => {
      window.dispatchEvent(evt);
    });

    // Then
    expect(fakeRunner).not.toHaveBeenCalled();
  });

  it("uploads through the rail upload input when no image is loaded", async () => {
    // Given
    const user = userEvent.setup();
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    const input = screen.getByTestId("rail-upload-input") as HTMLInputElement;

    // When
    await user.upload(input, makeFile("rail.png"));
    await waitFor(() =>
      expect(screen.queryByTestId("preview-grid")).not.toBeNull(),
    );

    // Then
    expect(fakeRunner).toHaveBeenCalled();
  });

  it("invokes the downstream download anchor after a successful run", async () => {
    // Given
    const user = userEvent.setup();
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );
    await user.upload(
      screen.getByTestId("dewatermark-file-input") as HTMLInputElement,
      makeFile(),
    );
    await waitFor(() =>
      expect(
        (screen.getByTestId("rail-download") as HTMLButtonElement).disabled,
      ).toBe(false),
    );

    // When
    await user.click(screen.getByTestId("rail-download"));

    // Then — createObjectURL fires twice (preview + download anchor)
    expect(createSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it("renders the slim header navigation", () => {
    // Given/When
    render(
      <DewatermarkPageContent
        workspaceOptions={{ runner: fakeRunner, decoder: fakeDecoder, debounceMs: 0 }}
      />,
    );

    // Then
    expect(
      screen
        .getByRole("navigation", { name: "MPC Tools sections" })
        .querySelectorAll("a").length,
    ).toBe(4);
  });
});
