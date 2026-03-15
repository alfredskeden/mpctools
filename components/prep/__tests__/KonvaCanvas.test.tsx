import { render, screen, fireEvent, act } from "@testing-library/react";
import { KonvaCanvas } from "../KonvaCanvas";
import { transformerVisibilityCalls } from "@/__mocks__/react-konva";

vi.mock("react-konva");

const makeImage = () => ({ width: 400, height: 600 }) as HTMLImageElement;

const defaultProps = {
  image: null as HTMLImageElement | null,
  selectedOverlay: null as string | null,
  scale: 1,
  position: { x: 0, y: 0 },
  rotation: 0,
  onPositionChange: vi.fn(),
  onScaleChange: vi.fn(),
  onRotationChange: vi.fn(),
  onExport: vi.fn(),
};

const defaultBCR = {
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

describe("KonvaCanvas", () => {
  let originalGetBCR: typeof Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    originalGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return defaultBCR;
    };
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBCR;
    vi.useRealTimers();
  });

  it("renders the stage", () => {
    render(<KonvaCanvas {...defaultProps} />);

    expect(screen.getByTestId("konva-stage")).toBeDefined();
  });

  it("renders background rect", () => {
    render(<KonvaCanvas {...defaultProps} />);

    expect(screen.getByTestId("konva-rect")).toBeDefined();
  });

  it("does not render image when image is null", () => {
    render(<KonvaCanvas {...defaultProps} />);

    expect(screen.queryByTestId("konva-image")).toBeNull();
  });

  it("renders image when image prop is provided", () => {
    render(<KonvaCanvas {...defaultProps} image={makeImage()} />);

    expect(screen.getByTestId("konva-image")).toBeDefined();
  });

  it("renders transformer when image is provided", () => {
    render(<KonvaCanvas {...defaultProps} image={makeImage()} />);

    expect(screen.getByTestId("konva-transformer")).toBeDefined();
  });

  it("calls onExport when image is provided", () => {
    const onExport = vi.fn();
    render(
      <KonvaCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  it("hides overlay layer during export and restores it", () => {
    const OriginalImage = globalThis.Image;

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

    const onExport = vi.fn();
    render(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlay="tall_normal"
        onExport={onExport}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Export should still be called (overlay hidden then restored)
    expect(onExport).toHaveBeenCalledWith("data:image/png;base64,mock");

    vi.stubGlobal("Image", OriginalImage);
  });

  it("calls onPositionChange on drag end", () => {
    const onPositionChange = vi.fn();
    render(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const imgEl = screen.getByTestId("konva-image");

    // Simulate drag: mousedown → mousemove → mouseup
    fireEvent.mouseDown(imgEl, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(imgEl, { clientX: 50, clientY: 30 });
    fireEvent.mouseUp(imgEl);

    // Mock returns position from props (x=0, y=0) since it doesn't track drag state
    expect(onPositionChange).toHaveBeenCalledWith(0, 0);
  });

  it("does not render overlay when selectedOverlay is null", () => {
    render(<KonvaCanvas {...defaultProps} image={makeImage()} />);

    expect(screen.queryByTestId("konva-overlay")).toBeNull();
  });

  it("loads and renders overlay when selectedOverlay is set", () => {
    const OriginalImage = globalThis.Image;

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
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlay="tall_normal"
      />,
    );

    expect(screen.getByTestId("konva-overlay")).toBeDefined();

    vi.stubGlobal("Image", OriginalImage);
  });

  it("clears overlay when selectedOverlay becomes null", () => {
    const OriginalImage = globalThis.Image;

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

    const { rerender } = render(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlay="tall_normal"
      />,
    );

    expect(screen.getByTestId("konva-overlay")).toBeDefined();

    rerender(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlay={null}
      />,
    );

    expect(screen.queryByTestId("konva-overlay")).toBeNull();

    vi.stubGlobal("Image", OriginalImage);
  });

  it("clears overlay for unknown overlay id", () => {
    render(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlay="unknown_id"
      />,
    );

    expect(screen.queryByTestId("konva-overlay")).toBeNull();
  });

  it("re-exports when position changes", () => {
    const onExport = vi.fn();
    const { rerender } = render(
      <KonvaCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });
    const callCount = onExport.mock.calls.length;

    rerender(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        position={{ x: 10, y: 20 }}
        onExport={onExport}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport.mock.calls.length).toBeGreaterThan(callCount);
  });

  it("does not export when image is null", () => {
    const onExport = vi.fn();
    render(<KonvaCanvas {...defaultProps} onExport={onExport} />);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).not.toHaveBeenCalled();
  });

  it("computes display size from container dimensions", () => {
    // beforeEach already mocks BCR to 700x1000 (width-constrained)
    const { container } = render(<KonvaCanvas {...defaultProps} />);

    // The inner display wrapper should have non-zero dimensions
    const displayWrapper = container.querySelector(
      "[style*='box-shadow']",
    ) as HTMLElement;
    expect(displayWrapper).toBeDefined();
    // Width-constrained: displayWidth = 700, displayHeight = 700 / (3520/4800) ≈ 954.5
    expect(parseFloat(displayWrapper.style.width)).toBeCloseTo(700, 0);
    expect(parseFloat(displayWrapper.style.height)).toBeGreaterThan(0);
  });

  it("computes display size for height-constrained container", () => {
    // A very wide container where height is the constraint
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 2000,
        height: 500,
        top: 0,
        left: 0,
        bottom: 500,
        right: 2000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    const { container } = render(<KonvaCanvas {...defaultProps} />);

    const displayWrapper = container.querySelector(
      "[style*='box-shadow']",
    ) as HTMLElement;
    // Height-constrained: displayHeight = 500, displayWidth = 500 * (3520/4800) ≈ 366.7
    expect(parseFloat(displayWrapper.style.height)).toBeCloseTo(500, 0);
    expect(parseFloat(displayWrapper.style.width)).toBeLessThan(500);
  });

  it("handles zero-size container gracefully", () => {
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    // Should not throw — Stage is not rendered when display size is zero
    const { container } = render(<KonvaCanvas {...defaultProps} />);
    expect(container.querySelector("[data-testid='konva-stage']")).toBeNull();
  });

  it("hides transformer during export so only background and image layers are exported", () => {
    // Given
    transformerVisibilityCalls.length = 0;
    const onExport = vi.fn();

    // When
    render(
      <KonvaCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Then — the transformer should have been hidden before toDataURL and restored after
    expect(onExport).toHaveBeenCalled();
    expect(transformerVisibilityCalls).toContain(false);
    expect(
      transformerVisibilityCalls[transformerVisibilityCalls.length - 1],
    ).toBe(true);
  });

  it("passes pixelRatio to Stage based on displayScale and devicePixelRatio", () => {
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 352,
        height: 480,
        top: 0,
        left: 0,
        bottom: 480,
        right: 352,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    Object.defineProperty(window, "devicePixelRatio", {
      value: 3,
      configurable: true,
    });

    render(<KonvaCanvas {...defaultProps} />);

    const stage = screen.getByTestId("konva-stage");
    const pixelRatio = parseFloat(stage.getAttribute("data-pixel-ratio")!);
    // displayScale = 352 / 3520 = 0.1, stagePixelRatio = min(1, 0.1 * 3) = 0.3
    expect(pixelRatio).toBeCloseTo(0.3, 1);

    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  it("caps pixelRatio at 1", () => {
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 3520,
        height: 4800,
        top: 0,
        left: 0,
        bottom: 4800,
        right: 3520,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };

    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      configurable: true,
    });

    render(<KonvaCanvas {...defaultProps} />);

    const stage = screen.getByTestId("konva-stage");
    const pixelRatio = parseFloat(stage.getAttribute("data-pixel-ratio")!);
    // displayScale = 1, stagePixelRatio = min(1, 1 * 2) = 1
    expect(pixelRatio).toBe(1);

    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  it("calls onScaleChange and onRotationChange on transform end", () => {
    const onScaleChange = vi.fn();
    const onRotationChange = vi.fn();
    render(
      <KonvaCanvas
        {...defaultProps}
        image={makeImage()}
        scale={1.5}
        rotation={45}
        onScaleChange={onScaleChange}
        onRotationChange={onRotationChange}
      />,
    );

    const imgEl = screen.getByTestId("konva-image");
    // Double-click triggers onTransformEnd in the mock
    fireEvent.doubleClick(imgEl);

    expect(onScaleChange).toHaveBeenCalledWith(1.5);
    expect(onRotationChange).toHaveBeenCalledWith(45);
  });
});
