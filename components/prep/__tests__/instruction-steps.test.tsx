import { render, screen, fireEvent } from "@testing-library/react";
import { InstructionSteps } from "../instruction-steps";
import type { PrepState } from "@/hooks/use-prep-workflow";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const defaultState: PrepState = {
  currentStep: 1,
  uploadedImage: null,
  imageElement: null,
  fileName: null,
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  isPositioned: false,
  isDownloaded: false,
  selectedOverlays: [],
  canvasDataUrl: null,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  dpiOverride: null,
  overlayOpacities: {},
  keepAspectRatio: true,
  algorithm: "detail-preserving",
  overlayNativeDimensions: null,
  canvasSizingMode: "scale-image",
  canvasAspect: { w: 11, h: 15 },
};

const noop = () => {};

const defaultProps = {
  stepStatuses: ["active", "upcoming", "upcoming"] as const,
  state: defaultState,
  onUploadImage: vi.fn(),
  onToggleOverlay: vi.fn(),
  onUpdateScale: vi.fn(),
  onUpdateRotation: vi.fn(),
  onMarkPositioned: vi.fn(),
  onReposition: noop,
  prepAction: null,
  onUpdatePosition: noop,
  onSetOverlayOpacity: noop,
  onSetCanvasSize: noop,
  onSetCanvasSizingMode: noop,
  onSetCanvasSizeStep: noop,
  onSetNativeCanvasDimension: noop,
  onSetDpiOverride: noop,
  onSetKeepAspectRatio: noop,
  onSetAlgorithm: noop,
  onSetImageDimensions: noop,
  onCenterHorizontal: noop,
  onCenterVertical: noop,
  onFitWidth: noop,
  onFitHeight: noop,
  onSetVerticalPreset: noop,
};

describe("InstructionSteps", () => {
  it("renders an aside with instructions label", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(
      screen.getByRole("complementary", { name: "Instructions" }),
    ).toBeDefined();
  });

  it("renders all three step circles", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll("[data-status]");
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it("renders upload button when step 1 is active", () => {
    render(<InstructionSteps {...defaultProps} />);

    const btns = screen.getAllByTestId("upload-trigger-btn");
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("renders file input for upload", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getByTestId("file-input")).toBeDefined();
  });

  it("shows filename when step 1 is completed", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "lightning_bolt.png",
        imageElement: {} as HTMLImageElement,
      },
    };

    render(<InstructionSteps {...props} />);

    expect(
      screen.getAllByText(/lightning_bolt\.png/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders active step circle with active status", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const activeCircles = container.querySelectorAll("[data-status='active']");
    expect(activeCircles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders completed step circle with completed status", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
      },
    };

    const { container } = render(<InstructionSteps {...props} />);

    const completedCircles = container.querySelectorAll(
      "[data-status='completed']",
    );
    expect(completedCircles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders upcoming step circles with upcoming status", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const upcomingCircles = container.querySelectorAll(
      "[data-status='upcoming']",
    );
    expect(upcomingCircles.length).toBeGreaterThanOrEqual(1);
  });

  it("shows controls panel when step 2 is active", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
      },
    };

    render(<InstructionSteps {...props} />);

    expect(
      screen.getAllByRole("group", { name: "Controls" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Decrease scale" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Increase scale" }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows reposition button when step 2 is completed", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as const,
      state: {
        ...defaultState,
        currentStep: 3 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
        isPositioned: true,
      },
    };

    render(<InstructionSteps {...props} />);

    expect(
      screen.getAllByRole("button", { name: /reposition/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("applies opacity to upcoming step wrappers", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const dimmed = container.querySelectorAll(".opacity-35");
    expect(dimmed.length).toBeGreaterThanOrEqual(2);
  });

  it("shows step 3 content when step 3 is active", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "completed", "active"] as const,
      state: {
        ...defaultState,
        currentStep: 3 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
        isPositioned: true,
      },
    };

    render(<InstructionSteps {...props} />);

    // Step 3 active branch renders — no upload or controls shown
    expect(screen.queryAllByTestId("upload-trigger-btn")).toHaveLength(0);
    expect(screen.queryAllByRole("group", { name: "Controls" })).toHaveLength(
      0,
    );
  });

  it("shows mark-positioned button when step 2 is active", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
      },
    };

    render(<InstructionSteps {...props} />);

    expect(screen.getAllByTestId("mark-positioned-btn").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onMarkPositioned when mark-positioned button is clicked", () => {
    const onMarkPositioned = vi.fn();
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
      },
      onMarkPositioned,
    };

    render(<InstructionSteps {...props} />);

    fireEvent.click(screen.getAllByTestId("mark-positioned-btn")[0]);
    expect(onMarkPositioned).toHaveBeenCalledOnce();
  });

  it("does not show mark-positioned button when step 2 is not active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.queryAllByTestId("mark-positioned-btn")).toHaveLength(0);
  });

  it("ignores non-image files", () => {
    render(<InstructionSteps {...defaultProps} />);

    const input = screen.getByTestId("file-input");
    const file = new File(["text"], "doc.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(defaultProps.onUploadImage).not.toHaveBeenCalled();
  });

  it("ignores empty file selection", () => {
    render(<InstructionSteps {...defaultProps} />);

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [] } });

    expect(defaultProps.onUploadImage).not.toHaveBeenCalled();
  });

  it("reads and uploads image file", () => {
    const onUploadImage = vi.fn();
    const OriginalFileReader = globalThis.FileReader;
    const OriginalImage = globalThis.Image;

    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null;
      readAsDataURL() {
        this.onload?.({ target: { result: "data:image/png;base64,abc" } });
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);

    vi.stubGlobal("Image", function MockImage(this: HTMLImageElement) {
      const img = new OriginalImage();
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

    render(
      <InstructionSteps {...defaultProps} onUploadImage={onUploadImage} />,
    );

    const input = screen.getByTestId("file-input");
    const file = new File(["pixels"], "card.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUploadImage).toHaveBeenCalledOnce();
    expect(onUploadImage).toHaveBeenCalledWith(
      "data:image/png;base64,abc",
      expect.any(HTMLImageElement),
      "card.png",
    );

    vi.stubGlobal("FileReader", OriginalFileReader);
    vi.stubGlobal("Image", OriginalImage);
  });

  it("clicks file input when upload trigger button is clicked", () => {
    render(<InstructionSteps {...defaultProps} />);

    const input = screen.getByTestId("file-input");
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getAllByTestId("upload-trigger-btn")[0]);
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("applies opacity to all steps when all are upcoming", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["upcoming", "upcoming", "upcoming"] as const,
    };

    const { container } = render(<InstructionSteps {...props} />);

    const dimmed = container.querySelectorAll(".opacity-35");
    expect(dimmed.length).toBeGreaterThanOrEqual(3);
  });

  it("shows step 3 content when step 3 is upcoming", () => {
    render(<InstructionSteps {...defaultProps} />);

    // Step 3 upcoming branch: no upload or controls, just description
    // The file input and upload button exist only for step 1 active state
    expect(screen.queryAllByRole("group", { name: "Controls" })).toHaveLength(
      0,
    );
  });

  it("shows mobile advanced options when step 2 is active", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["completed", "active", "upcoming"] as const,
      state: {
        ...defaultState,
        currentStep: 2 as const,
        fileName: "test.png",
        imageElement: {} as HTMLImageElement,
      },
    };

    render(<InstructionSteps {...props} />);

    expect(
      screen.getAllByRole("button", { name: /advanced options/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("does not show mobile advanced options when step 2 is not active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /advanced options/i }),
    ).toBeNull();
  });
});
