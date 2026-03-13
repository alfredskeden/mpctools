import { render, screen, fireEvent, act } from "@testing-library/react";
import { PrepPageContent } from "./prep-page-content";

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
  it("shows the drop zone initially", () => {
    render(<PrepPageContent />);

    expect(screen.getByRole("button", { name: "Upload image" })).toBeDefined();
  });

  it("shows instruction steps", () => {
    render(<PrepPageContent />);

    expect(screen.getByText("Upload card art")).toBeDefined();
    expect(screen.getByText("Position on canvas")).toBeDefined();
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

    expect(screen.getByRole("img", { name: "Card art canvas" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Upload image" })).toBeNull();

    mocks.restore();
  });

  it("triggers download when download button is clicked", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    // Drag to mark positioned
    const canvas = screen.getByRole("img", { name: "Card art canvas" });
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 120 });
    fireEvent.mouseUp(canvas);

    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          click: clickSpy,
          download: "",
          href: "",
        } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });

    const downloadBtn = screen.getByRole("button", { name: /download png/i });
    fireEvent.click(downloadBtn);

    expect(clickSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
    mocks.restore();
  });

  it("shows overlay selector after image upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    expect(screen.queryByRole("group", { name: "Overlay options" })).toBeNull();

    act(() => {
      uploadFile();
    });

    expect(
      screen.getByRole("group", { name: "Overlay options" }),
    ).toBeDefined();
    expect(screen.getByText("None")).toBeDefined();
    expect(screen.getByText("Normal")).toBeDefined();

    mocks.restore();
  });

  it("selects an overlay when overlay button is clicked", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    const normalBtn = screen.getByText("Normal");
    fireEvent.click(normalBtn);

    expect(normalBtn.className).toContain("bg-primary");

    mocks.restore();
  });
});
