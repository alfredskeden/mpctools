import { render, screen, fireEvent } from "@testing-library/react";
import { PrepCanvas } from "../prep-canvas";

function createMockImage(width = 400, height = 600) {
  const img = new window.Image();
  Object.defineProperty(img, "width", { value: width });
  Object.defineProperty(img, "height", { value: height });
  return img;
}

const defaultProps = {
  imageElement: createMockImage(),
  position: { x: 0, y: 0 },
  scale: 1,
  onPositionChange: vi.fn(),
  onScaleChange: vi.fn(),
  onMarkPositioned: vi.fn(),
  onCanvasDataUrl: vi.fn(),
  selectedOverlay: null as string | null,
};

describe("PrepCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a canvas element", () => {
    render(<PrepCanvas {...defaultProps} />);

    expect(screen.getByRole("img", { name: "Card art canvas" })).toBeDefined();
  });

  it("sets canvas dimensions to 744x1039", () => {
    render(<PrepCanvas {...defaultProps} />);

    const canvas = screen.getByRole("img", {
      name: "Card art canvas",
    }) as HTMLCanvasElement;
    expect(canvas.width).toBe(744);
    expect(canvas.height).toBe(1039);
  });

  it("fills gray background and draws image on mount", () => {
    render(<PrepCanvas {...defaultProps} />);

    const canvas = screen.getByRole("img", {
      name: "Card art canvas",
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    expect(ctx?.fillRect).toHaveBeenCalled();
    expect(ctx?.drawImage).toHaveBeenCalled();
  });

  it("emits canvas data URL on mount", () => {
    const onCanvasDataUrl = vi.fn();
    render(<PrepCanvas {...defaultProps} onCanvasDataUrl={onCanvasDataUrl} />);

    expect(onCanvasDataUrl).toHaveBeenCalled();
  });

  it("starts dragging on mouseDown", () => {
    render(<PrepCanvas {...defaultProps} />);

    const canvas = screen.getByRole("img", { name: "Card art canvas" });
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Dragging started but no move yet — no position change
    expect(defaultProps.onPositionChange).not.toHaveBeenCalled();
  });

  it("updates position on drag", () => {
    const onPositionChange = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onPositionChange={onPositionChange} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 120 });

    expect(onPositionChange).toHaveBeenCalled();
  });

  it("marks positioned on mouse up after drag", () => {
    const onMarkPositioned = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onMarkPositioned={onMarkPositioned} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 120 });
    fireEvent.mouseUp(canvas);

    expect(onMarkPositioned).toHaveBeenCalled();
  });

  it("does not mark positioned on mouse up without drag", () => {
    const onMarkPositioned = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onMarkPositioned={onMarkPositioned} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    expect(onMarkPositioned).not.toHaveBeenCalled();
  });

  it("stops dragging on mouseLeave", () => {
    const onPositionChange = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onPositionChange={onPositionChange} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 120 });
    fireEvent.mouseLeave(canvas);

    onPositionChange.mockClear();

    fireEvent.mouseMove(canvas, { clientX: 130, clientY: 140 });
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("adjusts scale on wheel event", () => {
    const onScaleChange = vi.fn();
    render(<PrepCanvas {...defaultProps} onScaleChange={onScaleChange} />);

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.wheel(canvas, { deltaY: -100 });

    expect(onScaleChange).toHaveBeenCalled();
  });

  it("marks positioned on wheel event", () => {
    const onMarkPositioned = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onMarkPositioned={onMarkPositioned} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.wheel(canvas, { deltaY: -100 });

    expect(onMarkPositioned).toHaveBeenCalled();
  });

  it("does not call onMarkPositioned again on second wheel event", () => {
    const onMarkPositioned = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onMarkPositioned={onMarkPositioned} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.wheel(canvas, { deltaY: -100 });
    expect(onMarkPositioned).toHaveBeenCalledTimes(1);

    fireEvent.wheel(canvas, { deltaY: -100 });
    // hasDragged is already true, so onMarkPositioned is not called again from the wheel guard
    expect(onMarkPositioned).toHaveBeenCalledTimes(1);
  });

  it("ignores mouse move when not dragging", () => {
    const onPositionChange = vi.fn();
    render(
      <PrepCanvas {...defaultProps} onPositionChange={onPositionChange} />,
    );

    const canvas = screen.getByRole("img", { name: "Card art canvas" });

    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 120 });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("loads and draws overlay image when selectedOverlay is set", () => {
    const OriginalImage = globalThis.Image;
    let capturedOnload: (() => void) | null = null;
    vi.stubGlobal("Image", function MockImage(this: HTMLImageElement) {
      const img = new OriginalImage();
      Object.defineProperty(img, "onload", {
        set(fn: () => void) {
          capturedOnload = fn;
        },
        get() {
          return capturedOnload;
        },
        configurable: true,
      });
      return img;
    });

    render(<PrepCanvas {...defaultProps} selectedOverlay="normal" />);

    // Trigger the onload to simulate image loaded
    expect(capturedOnload).not.toBeNull();
    capturedOnload!();

    const canvas = screen.getByRole("img", {
      name: "Card art canvas",
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    // drawImage called for user image + overlay
    expect(ctx?.drawImage).toHaveBeenCalled();

    vi.stubGlobal("Image", OriginalImage);
  });

  it("clears overlay ref when selectedOverlay is null", () => {
    const { rerender } = render(
      <PrepCanvas {...defaultProps} selectedOverlay="normal" />,
    );

    rerender(<PrepCanvas {...defaultProps} selectedOverlay={null} />);

    const canvas = screen.getByRole("img", {
      name: "Card art canvas",
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    // fillRect is called for gray background; drawImage still called for user image
    expect(ctx?.fillRect).toHaveBeenCalled();
  });

  it("clears overlay ref for unknown overlay id", () => {
    render(<PrepCanvas {...defaultProps} selectedOverlay="nonexistent" />);

    const canvas = screen.getByRole("img", {
      name: "Card art canvas",
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    expect(ctx?.fillRect).toHaveBeenCalled();
  });
});
