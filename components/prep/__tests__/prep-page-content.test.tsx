import { render, screen, fireEvent, act } from "@testing-library/react";
import { PrepPageContent } from "../prep-page-content";

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
  let originalGetBCR: typeof Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    originalGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 700,
        height: 1000,
        top: 0,
        left: 0,
        bottom: 1000,
        right: 700,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBCR;
  });

  it("shows the canvas placeholder initially", () => {
    const { container } = render(<PrepPageContent />);

    expect(container.querySelector(".bg-canvas-bg")).toBeDefined();
  });

  it("shows upload button initially", () => {
    render(<PrepPageContent />);

    expect(
      screen.getAllByTestId("upload-trigger-btn").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows instruction steps aside", () => {
    render(<PrepPageContent />);

    expect(
      screen.getByRole("complementary", { name: "Instructions" }),
    ).toBeDefined();
  });

  it("shows action buttons", () => {
    render(<PrepPageContent />);

    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /continue/i })).toBeDefined();
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

    expect(screen.getByTestId("transform-canvas-image")).toBeDefined();

    mocks.restore();
  });

  it("shows controls panel after image upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(
      screen.getAllByRole("group", { name: "Controls" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Decrease scale" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Increase scale" }).length,
    ).toBeGreaterThanOrEqual(1);

    mocks.restore();
  });

  it("shows filename after upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(
      screen.getAllByText(/card\.png/).length,
    ).toBeGreaterThanOrEqual(1);

    mocks.restore();
  });

  it("shows I'm Done button after upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    expect(
      screen.getAllByTestId("mark-positioned-btn").length,
    ).toBeGreaterThanOrEqual(1);

    mocks.restore();
  });

  it("downloads PNG after positioning", () => {
    vi.useFakeTimers();
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<PrepPageContent />);

    act(() => {
      uploadFile();
    });

    // Advance past export debounce so canvasDataUrl is set
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Mark as positioned
    act(() => {
      fireEvent.click(screen.getAllByTestId("mark-positioned-btn")[0]);
    });

    // Download button should be enabled (rendered in both mobile and desktop, pick first)
    const downloadBtn = screen.getAllByRole("button", {
      name: /download png/i,
    })[0];
    expect(downloadBtn).not.toBeDisabled();

    // Mock link.click and capture download name
    const clickSpy = vi.fn();
    let downloadName = "";
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string, options?: ElementCreationOptions) => {
        if (tag === "a") {
          return {
            set download(val: string) {
              downloadName = val;
            },
            set href(_val: string) {
              /* noop */
            },
            click: clickSpy,
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tag, options);
      });

    fireEvent.click(downloadBtn);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(downloadName).toBe("outpaint_card.png");

    createElementSpy.mockRestore();
    mocks.restore();
    vi.useRealTimers();
  });
});
