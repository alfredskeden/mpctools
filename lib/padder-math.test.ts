import {
  computePadLayout,
  CARD_REFERENCE,
  BLEED_REFERENCE,
  PAD_TARGETS,
} from "./padder-math";

const DEFAULT_TARGET = PAD_TARGETS[0];
const BORDERLESS_TARGET = PAD_TARGETS[1];

describe("computePadLayout — MPC default target", () => {
  it("turns the reference card into the reference bleed canvas", () => {
    // Given a scan at exactly the 300 DPI card size
    const image = { ...CARD_REFERENCE };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.canvas).toEqual(BLEED_REFERENCE);
  });

  it("centers the reference card with an even margin", () => {
    // Given
    const image = { ...CARD_REFERENCE };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.x).toBe(35);
    expect(layout?.y).toBe(35);
  });

  it("scales the bleed to a lower-resolution scan rather than padding to a fixed size", () => {
    // Given a Scryfall "large" jpg — the same card at a lower resolution
    const image = { width: 672, height: 936 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.canvas).toEqual({ width: 736, height: 1001 });
    expect(layout?.x).toBe(32);
    expect(layout?.y).toBe(32);
  });

  it("scales the bleed to a resolution that sits between the DPI tiers", () => {
    // Given
    const image = { width: 1200, height: 1680 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.canvas).toEqual({ width: 1318, height: 1793 });
    expect(layout?.x).toBe(59);
    expect(layout?.y).toBe(56);
  });

  it("keeps the image at its native dimensions — never resampled", () => {
    // Given
    const image = { width: 672, height: 936 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.image).toEqual(image);
  });

  it("adds proportionally the same bleed at any resolution", () => {
    // Given the same card at two resolutions
    const small = computePadLayout({ width: 745, height: 1040 }, DEFAULT_TARGET);
    const large = computePadLayout(
      { width: 1490, height: 2080 },
      DEFAULT_TARGET,
    );

    // When
    const smallShare = small!.x / small!.canvas.width;
    const largeShare = large!.x / large!.canvas.width;

    // Then
    expect(largeShare).toBeCloseTo(smallShare, 2);
  });

  it("holds the MPC bleed aspect ratio for the canvas", () => {
    // Given
    const image = { width: 672, height: 936 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout!.canvas.width / layout!.canvas.height).toBeCloseTo(
      BLEED_REFERENCE.width / BLEED_REFERENCE.height,
      2,
    );
  });

  it("never leaves the image wider than its canvas", () => {
    // Given a scan whose height drives the canvas
    const image = { width: 700, height: 1100 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout!.canvas.width).toBeGreaterThanOrEqual(image.width);
    expect(layout!.x).toBeGreaterThanOrEqual(0);
  });

  it("never leaves the image wider than its canvas when width drives it", () => {
    // Given a scan whose width drives the canvas
    const image = { width: 900, height: 1040 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout!.canvas.width).toBeGreaterThanOrEqual(image.width);
    expect(layout!.x).toBeGreaterThanOrEqual(0);
  });

  it("floors odd leftovers so offsets are always integers", () => {
    // Given
    const image = { width: 673, height: 936 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(Number.isInteger(layout!.x)).toBe(true);
    expect(Number.isInteger(layout!.y)).toBe(true);
  });

  it("reports no cropped pixels", () => {
    // Given
    const image = { ...CARD_REFERENCE };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(0);
  });
});

describe("computePadLayout — classic borderless target", () => {
  it("crops the canvas height to the 29:36 ratio", () => {
    // Given
    const image = { ...CARD_REFERENCE };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.canvas).toEqual({ width: 816, height: 1013 });
  });

  it("crops proportionally at a lower resolution", () => {
    // Given
    const image = { width: 672, height: 936 };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.canvas).toEqual({ width: 736, height: 914 });
  });

  it("keeps the default target's image position — no re-centering", () => {
    // Given
    const image = { ...CARD_REFERENCE };

    // When
    const defaultLayout = computePadLayout(image, DEFAULT_TARGET);
    const borderless = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(borderless?.x).toBe(defaultLayout?.x);
    expect(borderless?.y).toBe(defaultLayout?.y);
  });

  it("reports the image pixels cut off below the canvas bottom", () => {
    // Given
    const image = { ...CARD_REFERENCE };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(62);
  });

  it("reports zero cropped pixels when the image clears the cropped canvas", () => {
    // Given a portrait scan short enough for the cropped canvas to contain it
    const image = { width: 745, height: 760 };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(0);
  });
});

describe("computePadLayout — unusable input", () => {
  it("refuses a landscape image", () => {
    // Given
    const image = { width: 1040, height: 745 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout).toBeNull();
  });

  it("refuses a square image", () => {
    // Given
    const image = { width: 800, height: 800 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout).toBeNull();
  });

  it("refuses an image with no dimensions", () => {
    // Given
    const image = { width: 0, height: 0 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout).toBeNull();
  });
});

describe("PAD_TARGETS", () => {
  it("declares ratio labels rather than reducing pixel dimensions", () => {
    // Given / When
    const labels = PAD_TARGETS.map((target) => target.ratioLabel);

    // Then
    expect(labels).toEqual(["11:15", "29:36"]);
  });

  it("exposes a unique id per target", () => {
    // Given / When
    const ids = PAD_TARGETS.map((target) => target.id);

    // Then
    expect(new Set(ids).size).toBe(PAD_TARGETS.length);
  });
});
