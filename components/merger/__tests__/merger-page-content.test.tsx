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

vi.mock("@/lib/psd-export", () => ({
  downloadPsd: vi.fn(),
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
  it("shows three upload step inputs", () => {
    render(<MergerPageContent />);

    expect(screen.getByTestId("og-file-input")).toBeDefined();
    expect(screen.getByTestId("guide-file-input")).toBeDefined();
    expect(screen.getByTestId("outpaint-file-input")).toBeDefined();
  });

  it("shows download button", () => {
    render(<MergerPageContent />);

    expect(screen.getByRole("button", { name: /download merged/i })).toBeDefined();
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
    const downloadBtns = screen.getAllByRole("button", {
      name: /download merged/i,
    });
    expect(downloadBtns.length).toBeGreaterThanOrEqual(1);
    expect(downloadBtns[0]).not.toBeDisabled();

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

  it("does not crash when PSD download is clicked without canvas data", () => {
    render(<MergerPageContent />);

    const psdBtn = screen.getAllByRole("button", { name: /download psd/i })[0];
    fireEvent.click(psdBtn);

    expect(psdBtn).toBeDefined();
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

    const downloadBtns = screen.getAllByRole("button", {
      name: /download merged/i,
    });
    fireEvent.click(downloadBtns[0]);

    expect(downloadCanvasAsBlob).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      "merged_card.png",
    );

    mocks.restore();
  });

  it("triggers PSD download after all uploads", async () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    const { downloadPsd } = vi.mocked(await import("@/lib/psd-export"));
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

    const psdBtns = screen.getAllByRole("button", { name: /download psd/i });
    fireEvent.click(psdBtns[0]);

    expect(downloadPsd).toHaveBeenCalledWith(
      expect.objectContaining({ ogImage: expect.any(Object) }),
      "merged_card.psd",
    );

    mocks.restore();
  });
});
