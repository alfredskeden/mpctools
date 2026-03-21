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

  it("translates to scaled image center based on position and imageScale", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 100, y: 200 },
      imageScale: 2,
      renderScale: 1,
      rotation: 0,
    });

    // scaledW=800, scaledH=1200, centerX=(100+400)*1=500, centerY=(200+600)*1=800
    expect(ctx.translate).toHaveBeenCalledWith(500, 800);
  });

  it("applies renderScale to center position", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 100, y: 200 },
      imageScale: 1,
      renderScale: 0.25,
      rotation: 0,
    });

    // scaledW=400, scaledH=600, centerX=(100+200)*0.25=75, centerY=(200+300)*0.25=125
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

  it("does not call ctx.scale (scale is baked into drawImage)", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1.5,
      renderScale: 1,
      rotation: 0,
    });

    expect(ctx.scale).not.toHaveBeenCalled();
  });

  it("draws the image centered with scaled dimensions", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 1,
      renderScale: 1,
      rotation: 0,
    });

    // scaledW=400, scaledH=600, drawImage(img, -200, -300, 400, 600)
    expect(ctx.drawImage).toHaveBeenCalledWith(image, -200, -300, 400, 600);
  });

  it("draws with imageScale baked into dimensions", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      imageScale: 2,
      renderScale: 0.25,
      rotation: 0,
    });

    // scaledW=800, scaledH=1200, rs=0.25
    // drawImage(img, -800*0.25/2, -1200*0.25/2, 800*0.25, 1200*0.25)
    // = drawImage(img, -100, -150, 200, 300)
    expect(ctx.drawImage).toHaveBeenCalledWith(image, -100, -150, 200, 300);
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

  it("uses custom canvas dimensions when provided", () => {
    const image = createRealImage(400, 600);
    const createSpy = vi.spyOn(document, "createElement");
    const result = exportFullResolution(image, { x: 0, y: 0 }, 1, 0, 2048, 2048);

    expect(result).toMatch(/^data:image\/png/);
    const canvasCall = createSpy.mock.results.find(
      (r) => r.type === "return" && (r.value as HTMLElement).tagName === "CANVAS",
    );
    const canvas = canvasCall?.value as HTMLCanvasElement;
    expect(canvas.width).toBe(2048);
    expect(canvas.height).toBe(2048);

    vi.restoreAllMocks();
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
