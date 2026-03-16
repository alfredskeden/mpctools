import { renderPrepScene, exportFullResolution } from "./prep-renderer";
import { BG_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT } from "./canvas-utils";

function createMockCtx() {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createMockImage(width = 400, height = 600) {
  return { width, height } as CanvasImageSource & {
    width: number;
    height: number;
  };
}

describe("renderPrepScene", () => {
  it("fills the background with BG_COLOR at default canvas size", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.fillStyle).toBe(BG_COLOR);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  });

  it("fills the background at custom canvas size", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
      canvasWidth: 880,
      canvasHeight: 1200,
    });

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 880, 1200);
  });

  it("saves and restores context around image draw", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
  });

  it("translates to image center based on position and renderScale (not imageScale)", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 100, y: 200 },
      imageScale: 2,
      renderScale: 1,
      rotation: 0,
    });

    // translate(100*1 + (400*1)/2, 200*1 + (600*1)/2) = translate(300, 500)
    // imageScale does NOT affect the centering offset
    expect(ctx.translate).toHaveBeenCalledWith(300, 500);
  });

  it("applies renderScale to position and centering offset", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 100, y: 200 },
      imageScale: 1,
      renderScale: 0.25,
      rotation: 0,
    });

    // translate(100*0.25 + (400*0.25)/2, 200*0.25 + (600*0.25)/2) = translate(75, 125)
    expect(ctx.translate).toHaveBeenCalledWith(75, 125);
  });

  it("rotates by the given degrees converted to radians", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 90,
    });

    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it("applies combined imageScale * renderScale", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1.5,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.scale).toHaveBeenCalledWith(1.5, 1.5);
  });

  it("multiplies imageScale and renderScale together for ctx.scale", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 2,
      renderScale: 0.25,
      rotation: 0,
    });

    expect(ctx.scale).toHaveBeenCalledWith(0.5, 0.5);
  });

  it("draws the image centered at origin", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.drawImage).toHaveBeenCalledWith(image, -200, -300);
  });

  it("handles zero rotation without rotating", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.rotate).toHaveBeenCalledWith(0);
  });
});

describe("exportFullResolution", () => {
  function createRealImage(width = 400, height = 600) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas as unknown as CanvasImageSource & { width: number; height: number };
  }

  it("creates a full-resolution canvas and returns a data URL", () => {
    const image = createRealImage(400, 600);
    const result = exportFullResolution(image, { x: 10, y: 20 }, 1.5, 45);

    expect(result).toMatch(/^data:image\/png/);
  });

  it("returns empty string when getContext returns null", () => {
    const image = createRealImage(400, 600);
    const fakeCanvas = { width: 0, height: 0, getContext: () => null, toDataURL: () => "" };
    vi.spyOn(document, "createElement").mockReturnValueOnce(fakeCanvas as unknown as HTMLCanvasElement);

    const result = exportFullResolution(image, { x: 0, y: 0 }, 1, 0);

    expect(result).toBe("");

    vi.restoreAllMocks();
  });
});
