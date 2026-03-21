import { render, screen, fireEvent, act } from "@testing-library/react";
import { TransformCanvas } from "../TransformCanvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const makeImage = () => {
  const img = new window.Image();
  Object.defineProperty(img, "width", { value: 400, configurable: true });
  Object.defineProperty(img, "height", { value: 600, configurable: true });
  Object.defineProperty(img, "src", { value: "test.png", configurable: true, writable: true });
  return img;
};

const defaultProps = {
  image: null as HTMLImageElement | null,
  selectedOverlays: [] as string[],
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
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

describe("TransformCanvas", () => {
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

  it("renders the container", () => {
    render(<TransformCanvas {...defaultProps} />);

    expect(screen.getByTestId("transform-canvas-container")).toBeDefined();
  });

  it("renders background when stage is ready", () => {
    render(<TransformCanvas {...defaultProps} />);

    expect(screen.getByTestId("transform-canvas-bg")).toBeDefined();
  });

  it("does not render image when image is null", () => {
    render(<TransformCanvas {...defaultProps} />);

    expect(screen.queryByTestId("transform-canvas-image")).toBeNull();
  });

  it("renders image when image prop is provided", () => {
    render(<TransformCanvas {...defaultProps} image={makeImage()} />);

    expect(screen.getByTestId("transform-canvas-image")).toBeDefined();
  });

  it("applies CSS transform to image based on position, scale, and rotation", () => {
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        position={{ x: 100, y: 200 }}
        scale={1.5}
        rotation={45}
      />,
    );

    const img = screen.getByTestId("transform-canvas-image");
    const s = 700 / 3520;
    // Scale baked into dimensions, no CSS scale() in transform
    expect(img.style.transform).toBe(
      `translate(${100 * s}px, ${200 * s}px) rotate(45deg)`,
    );
    // Dimensions include imageScale
    expect(img.style.width).toBe(`${400 * 1.5 * s}px`);
    expect(img.style.height).toBe(`${600 * 1.5 * s}px`);
  });

  it("calls onExport with data URL after debounce when image is provided", () => {
    const onExport = vi.fn();
    render(
      <TransformCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).toHaveBeenCalledWith(expect.stringContaining("data:image/png"));
  });

  it("does not export when image is null", () => {
    const onExport = vi.fn();
    render(<TransformCanvas {...defaultProps} onExport={onExport} />);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).not.toHaveBeenCalled();
  });

  it("re-exports when position changes", () => {
    const onExport = vi.fn();
    const { rerender } = render(
      <TransformCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });
    const callCount = onExport.mock.calls.length;

    rerender(
      <TransformCanvas
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

  it("handles drag via pointer events", () => {
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");

    // Mock setPointerCapture
    surface.setPointerCapture = vi.fn();

    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 150, clientY: 130, pointerId: 1 });

    expect(onPositionChange).toHaveBeenCalled();
  });

  it("stops dragging on pointer up", () => {
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    surface.setPointerCapture = vi.fn();

    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(surface, { pointerId: 1 });

    onPositionChange.mockClear();

    fireEvent.pointerMove(surface, { clientX: 150, clientY: 130, pointerId: 1 });
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("ignores second pointer to prevent pinch-zoom chaos", () => {
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    surface.setPointerCapture = vi.fn();

    // First finger down
    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100, pointerId: 1 });
    // Second finger down — should be ignored
    fireEvent.pointerDown(surface, { clientX: 200, clientY: 200, pointerId: 2 });

    onPositionChange.mockClear();

    // Movement from second finger should be ignored
    fireEvent.pointerMove(surface, { clientX: 250, clientY: 250, pointerId: 2 });
    expect(onPositionChange).not.toHaveBeenCalled();

    // Movement from first finger should still work
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 110, pointerId: 1 });
    expect(onPositionChange).toHaveBeenCalled();
  });

  it("ignores pointer up from non-active pointer", () => {
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    surface.setPointerCapture = vi.fn();

    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100, pointerId: 1 });
    // Lifting a different pointer should not stop drag
    fireEvent.pointerUp(surface, { pointerId: 2 });

    onPositionChange.mockClear();

    // First pointer should still drag
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 110, pointerId: 1 });
    expect(onPositionChange).toHaveBeenCalled();
  });

  it("does not start drag when image is null", () => {
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    surface.setPointerCapture = vi.fn();

    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 150, clientY: 130, pointerId: 1 });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("handles wheel zoom", () => {
    const onScaleChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onScaleChange={onScaleChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    fireEvent.wheel(surface, { deltaY: -100 });

    expect(onScaleChange).toHaveBeenCalled();
  });

  it("clamps zoom to MIN_SCALE and MAX_SCALE", () => {
    const onScaleChange = vi.fn();

    // Test min clamp
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        scale={0.5}
        onScaleChange={onScaleChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    fireEvent.wheel(surface, { deltaY: 1000 }); // scroll down = zoom out

    expect(onScaleChange).toHaveBeenCalledWith(0.5); // clamped at MIN_SCALE
  });

  it("does not zoom when image is null", () => {
    const onScaleChange = vi.fn();
    render(
      <TransformCanvas {...defaultProps} onScaleChange={onScaleChange} />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    fireEvent.wheel(surface, { deltaY: -100 });

    expect(onScaleChange).not.toHaveBeenCalled();
  });

  it("computes display size from container dimensions", () => {
    const { container } = render(<TransformCanvas {...defaultProps} />);

    const displayWrapper = container.querySelector(
      "[style*='box-shadow']",
    ) as HTMLElement;
    expect(displayWrapper).toBeDefined();
    expect(parseFloat(displayWrapper.style.width)).toBeCloseTo(700, 0);
    expect(parseFloat(displayWrapper.style.height)).toBeGreaterThan(0);
  });

  it("computes display size for height-constrained container", () => {
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

    const { container } = render(<TransformCanvas {...defaultProps} />);

    const displayWrapper = container.querySelector(
      "[style*='box-shadow']",
    ) as HTMLElement;
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

    render(<TransformCanvas {...defaultProps} />);
    expect(screen.queryByTestId("transform-canvas-bg")).toBeNull();
  });

  it("does not render overlay when selectedOverlay is null", () => {
    render(<TransformCanvas {...defaultProps} image={makeImage()} />);

    expect(screen.queryByTestId("transform-canvas-overlay")).toBeNull();
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
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={["tall_normal"]}
      />,
    );

    expect(screen.getByTestId("transform-canvas-overlay")).toBeDefined();

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
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={["tall_normal"]}
      />,
    );

    expect(screen.getByTestId("transform-canvas-overlay")).toBeDefined();

    rerender(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={[]}
      />,
    );

    expect(screen.queryByTestId("transform-canvas-overlay")).toBeNull();

    vi.stubGlobal("Image", OriginalImage);
  });

  it("applies overlay opacity from overlayOpacities prop", () => {
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
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={["tall_normal"]}
        overlayOpacities={{ tall_normal: 50 }}
      />,
    );

    const overlay = screen.getByTestId("transform-canvas-overlay");
    expect(overlay.style.opacity).toBe("0.5");

    vi.stubGlobal("Image", OriginalImage);
  });

  it("defaults overlay opacity to 1 when not specified in overlayOpacities", () => {
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
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={["tall_normal"]}
        overlayOpacities={{}}
      />,
    );

    const overlay = screen.getByTestId("transform-canvas-overlay");
    expect(overlay.style.opacity).toBe("1");

    vi.stubGlobal("Image", OriginalImage);
  });

  it("clears overlay for unknown overlay id", () => {
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        selectedOverlays={["unknown_id"]}
      />,
    );

    expect(screen.queryByTestId("transform-canvas-overlay")).toBeNull();
  });

  it("cleans up export timer on unmount", () => {
    const onExport = vi.fn();
    const { unmount } = render(
      <TransformCanvas {...defaultProps} image={makeImage()} onExport={onExport} />,
    );

    // Unmount before timer fires
    unmount();

    // Advance timer — should not call onExport since cleanup cleared it
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).not.toHaveBeenCalled();
  });

  it("cleans up without error when no timer is set", () => {
    const { unmount, rerender } = render(
      <TransformCanvas {...defaultProps} />,
    );

    // Rerender to trigger effect cleanup with no timer
    rerender(<TransformCanvas {...defaultProps} image={makeImage()} />);

    // Should not throw
    unmount();
  });

  it("registers and cleans up visualViewport resize listener", () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    Object.defineProperty(window, "visualViewport", {
      value: { addEventListener: addSpy, removeEventListener: removeSpy },
      writable: true,
      configurable: true,
    });

    const { unmount } = render(<TransformCanvas {...defaultProps} />);

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("scales drag movement by inverse display scale", () => {
    // Container is 700px wide, canvas is 3520px, so displayScale = 700/3520 = 0.19886...
    const onPositionChange = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        onPositionChange={onPositionChange}
      />,
    );

    const surface = screen.getByTestId("transform-canvas-interaction");
    surface.setPointerCapture = vi.fn();

    fireEvent.pointerDown(surface, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 10, clientY: 10, pointerId: 1 });

    // dx in canvas space should be 10 / displayScale ≈ 50.3
    const [x, y] = onPositionChange.mock.calls[0];
    expect(x).toBeGreaterThan(10);
    expect(y).toBeGreaterThan(10);
  });

  it("adapts aspect ratio to custom canvas dimensions", () => {
    // Square canvas (1:1) should produce a square display area
    const { container } = render(
      <TransformCanvas {...defaultProps} canvasWidth={2048} canvasHeight={2048} />,
    );

    const displayWrapper = container.querySelector(
      "[style*='box-shadow']",
    ) as HTMLElement;
    // With 700x1000 container and 1:1 aspect, width-constrained: 700x700
    expect(parseFloat(displayWrapper.style.width)).toBeCloseTo(700, 0);
    expect(parseFloat(displayWrapper.style.height)).toBeCloseTo(700, 0);
  });

  it("uses custom canvas dimensions for export", () => {
    const onExport = vi.fn();
    render(
      <TransformCanvas
        {...defaultProps}
        image={makeImage()}
        canvasWidth={2048}
        canvasHeight={2048}
        onExport={onExport}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onExport).toHaveBeenCalledWith(expect.stringContaining("data:image/png"));
  });
});
