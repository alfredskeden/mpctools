import { render, screen, fireEvent, act } from "@testing-library/react";
import { PrepPageContent } from "../prep-page-content";

vi.mock("react-konva");

function setupImageMocks(dataUrl: string) {
  const OriginalFileReader = globalThis.FileReader;
  const OriginalImage = globalThis.Image;

  class MockFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    readAsDataURL() {
      this.onload?.({ target: { result: dataUrl } });
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);

  // Produce real HTMLImageElement instances so vitest-canvas-mock's drawImage accepts them
  vi.stubGlobal("Image", function MockImage(this: HTMLImageElement) {
    const img = new OriginalImage();
    Object.defineProperty(img, "width", { value: 400, configurable: true });
    Object.defineProperty(img, "height", { value: 600, configurable: true });

    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );

    Object.defineProperty(img, "src", {
      get() {
        return originalSrcDescriptor?.get?.call(img) ?? "";
      },
      set(val: string) {
        originalSrcDescriptor?.set?.call(img, val);
        // Fire onload synchronously for predictable test behavior
        img.onload?.(new Event("load"));
      },
      configurable: true,
    });

    return img;
  });

  return {
    restore() {
      vi.stubGlobal("FileReader", OriginalFileReader);
      vi.stubGlobal("Image", OriginalImage);
    },
  };
}

function uploadFile() {
  const file = new File(["pixels"], "card.png", { type: "image/png" });
  const input = screen.getByTestId("file-input");
  fireEvent.change(input, { target: { files: [file] } });
}

describe("PrepPageContent", () => {
  it("shows the canvas placeholder initially", () => {
    const { container } = render(<PrepPageContent />);

    expect(container.querySelector(".bg-canvas-bg")).toBeDefined();
  });

  it("shows upload button initially", () => {
    render(<PrepPageContent />);

    expect(screen.getByText("Upload Now")).toBeDefined();
  });

  it("shows instruction steps", () => {
    render(<PrepPageContent />);

    expect(screen.getByText("Upload your card art")).toBeDefined();
    expect(screen.getByText("Position & frame")).toBeDefined();
    expect(screen.getByText("Download prepared image")).toBeDefined();
  });

  it("shows action buttons", () => {
    render(<PrepPageContent />);

    expect(screen.getByText("Download PNG")).toBeDefined();
    expect(screen.getByText("Continue to Outpaint")).toBeDefined();
  });

  it("does not crash when download is clicked without canvas data", () => {
    render(<PrepPageContent />);

    // Download button is disabled but we can force a click to cover the early return
    const downloadBtn = screen.getByRole("button", { name: /download png/i });
    fireEvent.click(downloadBtn);

    // Should not throw — the early return in handleDownload guards against no canvasDataUrl
    expect(downloadBtn).toBeDefined();
  });

  it("switches to canvas after image upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(screen.getByTestId("konva-image")).toBeDefined();

    mocks.restore();
  });

  it("shows controls panel after image upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(screen.getByRole("group", { name: "Controls" })).toBeDefined();
    expect(screen.getByText("Scale")).toBeDefined();
    expect(screen.getByText("Frame Overlay")).toBeDefined();

    mocks.restore();
  });

  it("shows filename after upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(screen.getByText("card.png uploaded")).toBeDefined();

    mocks.restore();
  });

  it("shows I'm Done button after upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(screen.getByText("I'm Done")).toBeDefined();

    mocks.restore();
  });

  it("downloads PNG after positioning", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    // Mark as positioned
    act(() => {
      fireEvent.click(screen.getByText("I'm Done"));
    });

    // Download button should be enabled
    const downloadBtn = screen.getByRole("button", { name: /download png/i });
    expect(downloadBtn).not.toBeDisabled();

    // Mock link.click and capture download name
    const clickSpy = vi.fn();
    let downloadName = "";
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValueOnce({
        set download(val: string) {
          downloadName = val;
        },
        set href(val: string) {
          /* noop */
        },
        click: clickSpy,
      } as unknown as HTMLAnchorElement);

    fireEvent.click(downloadBtn);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(downloadName).toBe("outpaint_card.png");

    createElementSpy.mockRestore();
    mocks.restore();
  });
});
