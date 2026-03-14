import { render, screen, fireEvent } from "@testing-library/react";
import { InstructionSteps } from "./instruction-steps";
import type { PrepState } from "@/hooks/use-prep-workflow";

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
  selectedOverlay: null,
  canvasDataUrl: null,
};

const defaultProps = {
  stepStatuses: ["active", "upcoming", "upcoming"] as const,
  state: defaultState,
  onUploadImage: vi.fn(),
  onSelectOverlay: vi.fn(),
  onUpdateScale: vi.fn(),
  onUpdateRotation: vi.fn(),
  onMarkPositioned: vi.fn(),
};

describe("InstructionSteps", () => {
  it("renders an aside with instructions label", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getByRole("complementary", { name: "Instructions" })).toBeDefined();
  });

  it("renders step titles", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getByText("Upload your card art")).toBeDefined();
    expect(screen.getByText("Position & frame")).toBeDefined();
    expect(screen.getByText("Download prepared image")).toBeDefined();
  });

  it("renders upload button when step 1 is active", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(screen.getByText("Upload Now")).toBeDefined();
    expect(
      screen.getByText("Upload your card scan from Scryfall or browse your files."),
    ).toBeDefined();
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

    expect(screen.getByText("lightning_bolt.png uploaded")).toBeDefined();
  });

  it("renders numbered circles for non-completed steps", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[0].textContent).toBe("1");
    expect(circles[1].textContent).toBe("2");
    expect(circles[2].textContent).toBe("3");
  });

  it("applies active styling to the active step circle", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[0].className).toContain("bg-accent-blue");
    expect(circles[0].className).toContain("text-white");
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
    expect(circles[0].className).toContain("bg-status-success-dark");
  });

  it("applies upcoming styling to upcoming step circles", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[2].className).toContain("border-surface-muted");
    expect(circles[2].className).toContain("text-text-tertiary");
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

    expect(screen.getByRole("group", { name: "Controls" })).toBeDefined();
    expect(screen.getByText("Scale")).toBeDefined();
    expect(screen.getByText("Position")).toBeDefined();
    expect(screen.getByText("Frame Overlay")).toBeDefined();
    expect(screen.getByText("Rotation")).toBeDefined();
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

    expect(screen.getByText("Positioned and framed")).toBeDefined();
  });

  it("applies opacity to upcoming steps", () => {
    const { container } = render(<InstructionSteps {...defaultProps} />);

    const steps = container.querySelectorAll(".opacity-35");
    expect(steps.length).toBe(2);
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
      screen.getByText("Your PNG is ready. Download it or continue to outpainting."),
    ).toBeDefined();
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

    expect(screen.getByText("I'm Done")).toBeDefined();
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

    fireEvent.click(screen.getByText("I'm Done"));
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

    render(<InstructionSteps {...defaultProps} onUploadImage={onUploadImage} />);

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

    fireEvent.click(screen.getByText("Upload Now"));
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("applies upcoming styling to step 1 when upcoming", () => {
    const props = {
      ...defaultProps,
      stepStatuses: ["upcoming", "upcoming", "upcoming"] as const,
    };

    const { container } = render(<InstructionSteps {...props} />);

    // All three steps should be upcoming with opacity
    const steps = container.querySelectorAll(".opacity-35");
    expect(steps.length).toBe(3);
  });

  it("shows step 3 description for upcoming state", () => {
    render(<InstructionSteps {...defaultProps} />);

    expect(
      screen.getByText("Export your positioned card as a PNG for Gemini outpainting."),
    ).toBeDefined();
  });
});
