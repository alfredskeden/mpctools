import {
  renderPadScene,
  exportPaddedCanvas,
  paddedFileName,
} from "./padder-renderer";
import { computePadLayout, PAD_TARGETS } from "./padder-math";
import { BG_COLOR } from "./canvas-utils";
import type { PadLayout } from "./padder-math";

const DEFAULT_TARGET = PAD_TARGETS[0];

function createMockCtx() {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createMockImage(width = 745, height = 1040) {
  return { width, height } as CanvasImageSource & {
    width: number;
    height: number;
  };
}

/** A real element, for the paths that reach the canvas mock's drawImage. */
function createRealImage(width = 745, height = 1040) {
  const image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  return image;
}

function layoutFor(width = 745, height = 1040): PadLayout {
  const layout = computePadLayout({ width, height }, DEFAULT_TARGET);
  /* v8 ignore start */
  if (!layout) throw new Error("expected a layout");
  /* v8 ignore stop */
  return layout;
}

describe("renderPadScene", () => {
  it("fills the whole canvas with the shared grey before drawing", () => {
    // Given
    const ctx = createMockCtx();
    const layout = layoutFor();

    // When
    renderPadScene(ctx, createMockImage(), layout);

    // Then
    expect(ctx.fillStyle).toBe(BG_COLOR);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 816, 1110);
  });

  it("draws the image once at native size at the layout offset", () => {
    // Given
    const ctx = createMockCtx();
    const image = createMockImage();
    const layout = layoutFor();

    // When
    renderPadScene(ctx, image, layout);

    // Then
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledWith(image, 35, 35, 745, 1040);
  });

  it("uses the cropped canvas height for the borderless target", () => {
    // Given
    const ctx = createMockCtx();
    const layout = computePadLayout({ width: 745, height: 1040 }, PAD_TARGETS[1]);

    // When
    renderPadScene(ctx, createMockImage(), layout!);

    // Then
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 816, 1013);
  });
});

describe("exportPaddedCanvas", () => {
  it("creates the canvas at the layout's full pixel size", () => {
    // Given
    const layout = layoutFor();

    // When
    const canvas = exportPaddedCanvas(createRealImage(), layout);

    // Then
    expect(canvas?.width).toBe(816);
    expect(canvas?.height).toBe(1110);
  });

  it("returns null when a 2D context is unavailable", () => {
    // Given
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    // When
    const canvas = exportPaddedCanvas(createMockImage(), layoutFor());

    // Then
    expect(canvas).toBeNull();
    getContext.mockRestore();
  });
});

describe("paddedFileName", () => {
  it("replaces the original extension with png", () => {
    // Given / When
    const name = paddedFileName("scryfall-scan.jpg");

    // Then
    expect(name).toBe("padded_scryfall-scan.png");
  });

  it("keeps a name that carries no extension", () => {
    // Given / When
    const name = paddedFileName("scan");

    // Then
    expect(name).toBe("padded_scan.png");
  });

  it("falls back to a fixed name when the file name is absent", () => {
    // Given / When
    const name = paddedFileName(undefined);

    // Then
    expect(name).toBe("padded_card.png");
  });
});
