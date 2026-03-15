import { render, screen, fireEvent, act } from "@testing-library/react";
import { MergerPageContent } from "../merger-page-content";

vi.mock("@/lib/merger-utils", () => ({
  applyFeatheredMask: vi.fn(),
  analyzeGuide: vi.fn(() => ({
    canvasW: 800,
    canvasH: 1200,
    ogX: 200,
    ogY: 300,
  })),
  downloadCanvasAsBlob: vi.fn(),
}));

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

  vi.stubGlobal("Image", function MockImage(this: HTMLImageElement) {
    const img = new OriginalImage();
    Object.defineProperty(img, "naturalWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(img, "naturalHeight", {
      value: 600,
      configurable: true,
    });

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

function uploadFile(testId: string, fileName: string) {
  const file = new File(["pixels"], fileName, { type: "image/png" });
  const input = screen.getByTestId(testId);
  fireEvent.change(input, { target: { files: [file] } });
}

describe(MergerPageContent.name, () => {
  it("shows all step titles", () => {
    render(<MergerPageContent />);

    expect(screen.getByText("Upload original card")).toBeDefined();
    expect(screen.getByText("Upload guide image")).toBeDefined();
    expect(screen.getByText("Upload outpaint result")).toBeDefined();
  });

  it("shows download button", () => {
    render(<MergerPageContent />);

    expect(screen.getByText("Download Merged")).toBeDefined();
  });

  it("shows canvas after OG upload", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<MergerPageContent />);

    act(() => {
      uploadFile("og-file-input", "card.png");
    });

    expect(screen.getByTestId("merger-canvas")).toBeDefined();

    mocks.restore();
  });

  it("advances through all steps", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    render(<MergerPageContent />);

    // Step 1: Upload OG
    act(() => {
      uploadFile("og-file-input", "card.png");
    });

    // Step 2: Upload guide
    act(() => {
      uploadFile("guide-file-input", "guide.png");
    });

    // Step 3: Upload outpaint
    act(() => {
      uploadFile("outpaint-file-input", "outpaint.png");
    });

    // Download should be enabled
    const downloadBtn = screen.getByRole("button", {
      name: /download merged/i,
    });
    expect(downloadBtn).not.toBeDisabled();

    mocks.restore();
  });

  it("does not crash when download is clicked without canvas data", () => {
    render(<MergerPageContent />);

    const downloadBtn = screen.getByRole("button", {
      name: /download merged/i,
    });
    fireEvent.click(downloadBtn);

    expect(downloadBtn).toBeDefined();
  });

  it("triggers download after all uploads", async () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    const { downloadCanvasAsBlob } = vi.mocked(
      await import("@/lib/merger-utils"),
    );
    render(<MergerPageContent />);

    act(() => {
      uploadFile("og-file-input", "card.png");
    });
    act(() => {
      uploadFile("guide-file-input", "guide.png");
    });
    act(() => {
      uploadFile("outpaint-file-input", "outpaint.png");
    });

    const downloadBtn = screen.getByRole("button", {
      name: /download merged/i,
    });
    fireEvent.click(downloadBtn);

    expect(downloadCanvasAsBlob).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      "merged_card.png",
    );

    mocks.restore();
  });
});
