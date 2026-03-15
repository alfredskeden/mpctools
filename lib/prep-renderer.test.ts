import { renderPrepScene } from "./prep-renderer";
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
      scale: 1,
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
      scale: 1,
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
      scale: 1,
      rotation: 0,
    });

    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
  });

  it("translates to image center based on position and scale", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 100, y: 200 },
      scale: 2,
      rotation: 0,
    });

    // translate(100 + (400*2)/2, 200 + (600*2)/2) = translate(500, 800)
    expect(ctx.translate).toHaveBeenCalledWith(500, 800);
  });

  it("rotates by the given degrees converted to radians", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 90,
    });

    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it("applies the scale factor", () => {
    const ctx = createMockCtx();
    const image = createMockImage();

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      scale: 1.5,
      rotation: 0,
    });

    expect(ctx.scale).toHaveBeenCalledWith(1.5, 1.5);
  });

  it("draws the image centered at origin", () => {
    const ctx = createMockCtx();
    const image = createMockImage(400, 600);

    renderPrepScene(ctx, {
      image,
      position: { x: 0, y: 0 },
      scale: 1,
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
      scale: 1,
      rotation: 0,
    });

    expect(ctx.rotate).toHaveBeenCalledWith(0);
  });
});
