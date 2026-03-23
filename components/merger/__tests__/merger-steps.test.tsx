import { render, screen, fireEvent, act } from "@testing-library/react";
import { MergerSteps } from "../merger-steps";
import type { MergerState, StepStatus } from "@/hooks/use-merger-workflow";
import { initialState } from "@/hooks/use-merger-workflow";

vi.mock("@/lib/merger-utils", () => ({
  analyzeGuide: vi.fn(),
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

const defaultProps = {
  stepStatuses: ["active", "upcoming", "upcoming"] as StepStatus[],
  state: initialState,
  onUploadOg: vi.fn(),
  onUploadGuide: vi.fn(),
  onUploadOutpaint: vi.fn(),
  mergerAction: null as React.ReactNode,
};

describe("MergerSteps", () => {
  it("renders step 1 as upcoming when all steps are upcoming", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["upcoming", "upcoming", "upcoming"] as StepStatus[],
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("Upload original card").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all three step titles", () => {
    render(<MergerSteps {...defaultProps} />);

    expect(screen.getAllByText("Upload original card").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Upload guide image").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Upload outpaint result").length).toBeGreaterThanOrEqual(1);
  });

  it("shows upload button for active step 1", () => {
    render(<MergerSteps {...defaultProps} />);

    expect(screen.getAllByText("The high-res card scan from Scryfall.").length).toBeGreaterThanOrEqual(1);
    const buttons = screen.getAllByText("Choose file");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows upload button for active step 2", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as StepStatus[],
    };
    render(<MergerSteps {...props} />);

    expect(
      screen.getAllByText("The gray-bordered image from Step 1.").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows upload button for active step 3", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as StepStatus[],
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("The outpainted image from Gemini.").length).toBeGreaterThanOrEqual(1);
  });

  it("shows de-watermark and upscale tip links when step 3 is active", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as StepStatus[],
    };
    render(<MergerSteps {...props} />);

    const dewatermarkLinks = screen.getAllByRole("link", { name: /de-watermark/i });
    expect(dewatermarkLinks.length).toBeGreaterThanOrEqual(1);
    expect(dewatermarkLinks[0]).toHaveAttribute("href", "https://gip.mpcproxy.art/gwr/");

    const upscaleLinks = screen.getAllByRole("link", { name: /upscale with upscayl/i });
    expect(upscaleLinks.length).toBeGreaterThanOrEqual(1);
    expect(upscaleLinks[0]).toHaveAttribute("href", "https://upscayl.org/");
  });

  it("shows completed state with filename and filesize", () => {
    const state: MergerState = {
      ...initialState,
      ogFileName: "card.png",
      ogFileSize: 1024,
    };
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as StepStatus[],
      state,
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("card.png").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("(1.0 KB)").length).toBeGreaterThanOrEqual(1);
  });

  it("shows completed guide state", () => {
    const state: MergerState = {
      ...initialState,
      ogFileName: "card.png",
      ogFileSize: 1024,
      guideFileName: "guide.png",
      guideFileSize: 2048000,
    };
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as StepStatus[],
      state,
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("guide.png").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("(2.0 MB)").length).toBeGreaterThanOrEqual(1);
  });

  it("formats bytes correctly", () => {
    const state: MergerState = {
      ...initialState,
      ogFileName: "tiny.png",
      ogFileSize: 500,
    };
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as StepStatus[],
      state,
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("(500 B)").length).toBeGreaterThanOrEqual(1);
  });

  it("handles null fileSize gracefully", () => {
    const state: MergerState = {
      ...initialState,
      ogFileName: "card.png",
      ogFileSize: null,
    };
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as StepStatus[],
      state,
    };
    render(<MergerSteps {...props} />);

    expect(screen.getAllByText("(0 B)").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onUploadOg when file is uploaded in step 1", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    const onUploadOg = vi.fn();
    render(<MergerSteps {...defaultProps} onUploadOg={onUploadOg} />);

    const file = new File(["pixels"], "card.png", { type: "image/png" });
    const input = screen.getByTestId("og-file-input");

    act(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(onUploadOg).toHaveBeenCalledOnce();

    mocks.restore();
  });

  it("calls onUploadGuide with canvas when file is uploaded in step 2", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    const onUploadGuide = vi.fn();
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as StepStatus[],
      onUploadGuide,
    };
    render(<MergerSteps {...props} />);

    const file = new File(["pixels"], "guide.png", { type: "image/png" });
    const input = screen.getByTestId("guide-file-input");

    act(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(onUploadGuide).toHaveBeenCalledOnce();
    // Fourth argument should be a canvas element
    expect(onUploadGuide.mock.calls[0][3]).toBeInstanceOf(HTMLCanvasElement);

    mocks.restore();
  });

  it("calls onUploadOutpaint when file is uploaded in step 3", () => {
    const mocks = setupImageMocks("data:image/png;base64,abc");
    const onUploadOutpaint = vi.fn();
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as StepStatus[],
      onUploadOutpaint,
    };
    render(<MergerSteps {...props} />);

    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    const input = screen.getByTestId("outpaint-file-input");

    act(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(onUploadOutpaint).toHaveBeenCalledOnce();

    mocks.restore();
  });

  it("ignores non-image files", () => {
    const onUploadOg = vi.fn();
    render(<MergerSteps {...defaultProps} onUploadOg={onUploadOg} />);

    const file = new File(["text"], "doc.txt", { type: "text/plain" });
    const input = screen.getByTestId("og-file-input");

    act(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(onUploadOg).not.toHaveBeenCalled();
  });

  it("triggers file input click when Choose file button is clicked", () => {
    render(<MergerSteps {...defaultProps} />);

    const ogInput = screen.getByTestId("og-file-input");
    const clickSpy = vi.spyOn(ogInput, "click");

    const chooseFileBtns = screen.getAllByText("Choose file");
    fireEvent.click(chooseFileBtns[0]);

    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("ignores empty file input", () => {
    const onUploadOg = vi.fn();
    render(<MergerSteps {...defaultProps} onUploadOg={onUploadOg} />);

    const input = screen.getByTestId("og-file-input");

    act(() => {
      fireEvent.change(input, { target: { files: [] } });
    });

    expect(onUploadOg).not.toHaveBeenCalled();
  });
});
