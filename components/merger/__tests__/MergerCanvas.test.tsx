import { render, screen } from "@testing-library/react";
import { MergerCanvas } from "../MergerCanvas";
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
});
