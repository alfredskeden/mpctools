import { render, screen, fireEvent } from "@testing-library/react";

const mockProcessFile = vi.fn();
const mockReset = vi.fn();
const mockAcceptResult = vi.fn();
let mockState: Record<string, unknown> = { phase: "idle" };

vi.mock("@/hooks/use-dewatermark-dialog", () => ({
  useDewatermarkDialog: () => ({
    state: mockState,
    processFile: mockProcessFile,
    reset: mockReset,
    acceptResult: mockAcceptResult,
  }),
}));

import { DewatermarkDialog } from "@/components/merger/dewatermark-dialog";

afterEach(() => {
  vi.clearAllMocks();
  mockState = { phase: "idle" };
});

describe("DewatermarkDialog", () => {
  it("renders a trigger button", () => {
    // When
    render(<DewatermarkDialog onAccept={vi.fn()} />);

    // Then
    expect(screen.getByRole("button", { name: /de-watermark/i })).toBeDefined();
  });

  it("dialog is not visible by default", () => {
    // When
    render(<DewatermarkDialog onAccept={vi.fn()} />);

    // Then
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens dialog when trigger is clicked", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);

    // When
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("shows upload zone in idle phase", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByTestId("dewatermark-upload-zone")).toBeDefined();
    expect(screen.getByTestId("dewatermark-file-input")).toBeDefined();
  });

  it("calls processFile when a file is selected", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");

    // When
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    expect(mockProcessFile).toHaveBeenCalledWith(file);
  });

  it("ignores non-image files", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");

    // When
    const file = new File(["text"], "readme.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    expect(mockProcessFile).not.toHaveBeenCalled();
  });

  it("triggers file input click when upload zone is clicked", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");
    const clickSpy = vi.spyOn(input, "click");

    // When
    fireEvent.click(screen.getByTestId("dewatermark-upload-zone"));

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });

  it("triggers file input on keyboard Enter", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");
    const clickSpy = vi.spyOn(input, "click");

    // When
    fireEvent.keyDown(screen.getByTestId("dewatermark-upload-zone"), {
      key: "Enter",
    });

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });

  it("triggers file input on keyboard Space", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");
    const clickSpy = vi.spyOn(input, "click");

    // When
    fireEvent.keyDown(screen.getByTestId("dewatermark-upload-zone"), {
      key: " ",
    });

    // Then
    expect(clickSpy).toHaveBeenCalled();
  });

  it("does not trigger file input on other keys", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    const input = screen.getByTestId("dewatermark-file-input");
    const clickSpy = vi.spyOn(input, "click");

    // When
    fireEvent.keyDown(screen.getByTestId("dewatermark-upload-zone"), {
      key: "Tab",
    });

    // Then
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("shows spinner in processing phase", () => {
    // Given
    mockState = { phase: "processing" };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByTestId("dewatermark-spinner")).toBeDefined();
  });

  it("shows preview image in result phase", () => {
    // Given
    mockState = {
      phase: "result",
      blob: new Blob(["png"]),
      previewUrl: "blob:preview",
      metadata: {
        corner: "bottom-right",
        confidence: 0.87,
        alphaGain: 1.05,
        source: "adaptive",
      },
    };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByTestId("dewatermark-preview")).toBeDefined();
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:preview");
  });

  it("shows metadata in result phase", () => {
    // Given
    mockState = {
      phase: "result",
      blob: new Blob(["png"]),
      previewUrl: "blob:preview",
      metadata: {
        corner: "bottom-right",
        confidence: 0.87,
        alphaGain: 1.05,
        source: "adaptive",
      },
    };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByTestId("dewatermark-metadata")).toBeDefined();
  });

  it("calls acceptResult and onAccept when Use this image is clicked", async () => {
    // Given
    const onAccept = vi.fn();
    const mockImage = new Image();
    mockAcceptResult.mockResolvedValue({
      image: mockImage,
      fileName: "dewatermarked_123.png",
      fileSize: 2048,
    });
    mockState = {
      phase: "result",
      blob: new Blob(["png"]),
      previewUrl: "blob:preview",
      metadata: { corner: "bottom-right", confidence: 0.87, alphaGain: 1.05, source: "adaptive" },
    };
    render(<DewatermarkDialog onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // When
    await fireEvent.click(screen.getByRole("button", { name: /use this image/i }));

    // Then
    expect(mockAcceptResult).toHaveBeenCalledOnce();
  });

  it("calls reset when cancel button is clicked in result phase", () => {
    // Given
    mockState = {
      phase: "result",
      blob: new Blob(["png"]),
      previewUrl: "blob:preview",
      metadata: { corner: "bottom-right", confidence: 0.87, alphaGain: 1.05, source: "adaptive" },
    };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // When
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Then
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("shows error message in error phase", () => {
    // Given
    mockState = { phase: "error", message: "Failed to decode image" };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // Then
    expect(screen.getByTestId("dewatermark-error")).toBeDefined();
  });

  it("calls reset when try again is clicked in error phase", () => {
    // Given
    mockState = { phase: "error", message: "Failed to decode image" };
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));

    // When
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // Then
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("calls reset when dialog is closed via close button", () => {
    // Given
    render(<DewatermarkDialog onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /de-watermark/i }));
    expect(screen.getByRole("dialog")).toBeDefined();

    // When
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    // Then
    expect(mockReset).toHaveBeenCalledOnce();
  });
});
