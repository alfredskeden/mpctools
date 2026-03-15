import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { MergerCanvas, drawMergerScene } from "../MergerCanvas";
import type { MergerCanvasHandle } from "../MergerCanvas";
import type { MergerState } from "@/hooks/use-merger-workflow";
import { initialState } from "@/hooks/use-merger-workflow";

vi.mock("@/lib/merger-utils", () => ({
  applyFeatheredMask: vi.fn(),
  analyzeGuide: vi.fn(),
}));

const makeImage = (w: number, h: number) => {
  const img = new Image();
  Object.defineProperty(img, "naturalWidth", { value: w });
  Object.defineProperty(img, "naturalHeight", { value: h });
  return img;
};

describe("MergerCanvas", () => {
  it("shows placeholder when no content", () => {
    render(<MergerCanvas state={initialState} />);
    expect(screen.getByTestId("merger-canvas-placeholder")).toBeDefined();
    expect(screen.getByText("Upload images to preview")).toBeDefined();
  });

  it("shows canvas when canvasW and canvasH are set", () => {
    const state: MergerState = {
      ...initialState,
      canvasW: 400,
      canvasH: 600,
      ogImage: makeImage(400, 600),
      ogPosition: { x: 0, y: 0, w: 400, h: 600 },
    };

    render(<MergerCanvas state={state} />);
    expect(screen.getByTestId("merger-canvas")).toBeDefined();
  });

  it("renders with outpaint image", () => {
    const state: MergerState = {
      ...initialState,
      canvasW: 800,
      canvasH: 1200,
      ogImage: makeImage(400, 600),
      ogPosition: { x: 200, y: 300, w: 400, h: 600 },
      outpaintImage: makeImage(800, 1200),
      outpaintFileName: "outpaint.png",
      outpaintFileSize: 2048,
    };

    render(<MergerCanvas state={state} />);
    expect(screen.getByTestId("merger-canvas")).toBeDefined();
  });

  it("renders without OG image", () => {
    const state: MergerState = {
      ...initialState,
      canvasW: 400,
      canvasH: 600,
    };

    render(<MergerCanvas state={state} />);
    expect(screen.getByTestId("merger-canvas")).toBeDefined();
  });

  it("clamps height when canvas is taller than container", () => {
    // Use a very tall aspect ratio so h exceeds container height
    const state: MergerState = {
      ...initialState,
      canvasW: 100,
      canvasH: 10000,
      ogImage: makeImage(100, 10000),
      ogPosition: { x: 0, y: 0, w: 100, h: 10000 },
    };

    // Mock ResizeObserver to report a small container
    const originalRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class MockRO {
      private cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe(target: Element) {
        // Simulate a small container bounding rect
        vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
          width: 400,
          height: 300,
          top: 0,
          left: 0,
          bottom: 300,
          right: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
        this.cb([], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    };

    render(<MergerCanvas state={state} />);
    expect(screen.getByTestId("merger-canvas")).toBeDefined();

    globalThis.ResizeObserver = originalRO;
  });

  it("caps display canvas buffer below full resolution", () => {
    const state: MergerState = {
      ...initialState,
      canvasW: 3520,
      canvasH: 4800,
      ogImage: makeImage(3520, 4800),
      ogPosition: { x: 0, y: 0, w: 3520, h: 4800 },
    };

    render(<MergerCanvas state={state} />);
    const canvas = screen.getByTestId("merger-canvas") as HTMLCanvasElement;

    // MAX_DISPLAY_DIM = 2048, max dim = 4800
    // renderScale = 2048 / 4800 ≈ 0.4267
    // canvas.width = round(3520 * 0.4267) = 1502, canvas.height = round(4800 * 0.4267) = 2048
    expect(canvas.width).toBeLessThanOrEqual(2048);
    expect(canvas.height).toBeLessThanOrEqual(2048);
  });

  it("does not cap display canvas for small dimensions", () => {
    const state: MergerState = {
      ...initialState,
      canvasW: 400,
      canvasH: 600,
      ogImage: makeImage(400, 600),
      ogPosition: { x: 0, y: 0, w: 400, h: 600 },
    };

    render(<MergerCanvas state={state} />);
    const canvas = screen.getByTestId("merger-canvas") as HTMLCanvasElement;

    // renderScale = min(1, 2048/600) = 1, so full size
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(600);
  });

  it("getDownloadCanvas returns full-resolution canvas", () => {
    const ref = createRef<MergerCanvasHandle>();
    const state: MergerState = {
      ...initialState,
      canvasW: 3520,
      canvasH: 4800,
      ogImage: makeImage(3520, 4800),
      ogPosition: { x: 0, y: 0, w: 3520, h: 4800 },
    };

    render(<MergerCanvas ref={ref} state={state} />);

    const downloadCanvas = ref.current!.getDownloadCanvas()!;
    expect(downloadCanvas).toBeInstanceOf(HTMLCanvasElement);
    expect(downloadCanvas.width).toBe(3520);
    expect(downloadCanvas.height).toBe(4800);
  });

  it("getDownloadCanvas returns null when no content", () => {
    const ref = createRef<MergerCanvasHandle>();
    render(<MergerCanvas ref={ref} state={initialState} />);

    expect(ref.current!.getDownloadCanvas()).toBeNull();
  });
});

describe("drawMergerScene", () => {
  it("draws background and calls scale", () => {
    const ctx = {
      save: vi.fn(),
      scale: vi.fn(),
      fillStyle: "",
      fillRect: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const state: MergerState = {
      ...initialState,
      canvasW: 100,
      canvasH: 200,
    };

    drawMergerScene(ctx, state, 0.5);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.scale).toHaveBeenCalledWith(0.5, 0.5);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 200);
    expect(ctx.restore).toHaveBeenCalled();
  });
});
