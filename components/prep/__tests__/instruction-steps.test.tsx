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

  it("renders step titles", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(
      screen.getAllByText("Upload your card art").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Position & frame").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Download prepared image").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders upload button when step 1 is active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getAllByText("Upload Now").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(
        "Upload your card scan from Scryfall or browse your files.",
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders file input for upload", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getByTestId("file-input")).toBeDefined();
  });

  it("shows filename and change button when step 1 is completed", () => {
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
      screen.getAllByText("lightning_bolt.png uploaded").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders numbered circles for non-completed steps", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    // Desktop layout has 3 circles, mobile has 1 visible at a time
    const circles = container.querySelectorAll(".rounded-full");
    const circleTexts = Array.from(circles).map((c) => c.textContent);
    expect(circleTexts).toContain("1");
    expect(circleTexts).toContain("2");
    expect(circleTexts).toContain("3");
  });

  it("applies active styling to the active step circle", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll(".rounded-full");
    const activeCircles = Array.from(circles).filter((c) =>
      c.className.includes("bg-accent-blue"),
    );
    expect(activeCircles.length).toBeGreaterThanOrEqual(1);
    expect(activeCircles[0].className).toContain("text-white");
  });

  it("applies completed styling with green checkmark", () => {
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

    const circles = container.querySelectorAll(".rounded-full");
    const completedCircles = Array.from(circles).filter((c) =>
      c.className.includes("bg-status-success-dark"),
    );
    expect(completedCircles.length).toBeGreaterThanOrEqual(1);
  });

  it("applies upcoming styling to upcoming step circles", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll(".rounded-full");
    const upcomingCircles = Array.from(circles).filter((c) =>
      c.className.includes("border-surface-muted"),
    );
    expect(upcomingCircles.length).toBeGreaterThanOrEqual(1);
    expect(upcomingCircles[0].className).toContain("text-text-tertiary");
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
    expect(screen.getAllByText("Scale").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Decrease scale" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Increase scale" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Frame Overlay").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("shows positioned summary when step 2 is completed", () => {
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
      screen.getAllByText("Positioned and framed").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("applies opacity to upcoming steps", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const steps = container.querySelectorAll(".opacity-35");
    // Desktop has 2 upcoming steps with opacity, mobile content area may also have opacity
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });

  it("shows step 3 description for active state", () => {
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
      screen.getAllByText(
        "Your PNG is ready. Download it or continue to outpainting.",
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows I'm Done button when step 2 is active", () => {
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

    expect(screen.getAllByText("I'm Done").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onMarkPositioned when I'm Done is clicked", () => {
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

    fireEvent.click(screen.getAllByText("I'm Done")[0]);
    expect(onMarkPositioned).toHaveBeenCalledOnce();
  });

  it("does not show I'm Done button when step 2 is not active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.queryByText("I'm Done")).toBeNull();
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

  it("clicks file input when Upload Now is clicked", () => {
    render(<InstructionSteps {...defaultProps} />);

    const input = screen.getByTestId("file-input");
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getAllByText("Upload Now")[0]);
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("applies upcoming styling to step 1 when upcoming", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["upcoming", "upcoming", "upcoming"] as const,
    };

    const { container } = render(<InstructionSteps {...props} />);

    // All three desktop steps should be upcoming with opacity, plus mobile content
    const steps = container.querySelectorAll(".opacity-35");
    expect(steps.length).toBeGreaterThanOrEqual(3);
  });

  it("shows step 3 description for upcoming state", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(
      screen.getAllByText(
        "Export your positioned card as a PNG for Gemini outpainting.",
      ).length,
    ).toBeGreaterThanOrEqual(1);
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
      screen.getAllByText("Advanced options").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("does not show mobile advanced options when step 2 is not active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.queryByText("Advanced options")).toBeNull();
  });
});
