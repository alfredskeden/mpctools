import {
  selectTier,
  computePadLayout,
  MPC_TIERS,
  PAD_TARGETS,
} from "./padder-math";

const DEFAULT_TARGET = PAD_TARGETS[0];
const BORDERLESS_TARGET = PAD_TARGETS[1];

describe("selectTier", () => {
  it("selects the 300 DPI tier for a 745x1040 Scryfall png", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toEqual(MPC_TIERS[0]);
  });

  it("selects the 300 DPI tier for a 672x936 Scryfall large jpg", () => {
    // Given
    const image = { width: 672, height: 936 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toEqual(MPC_TIERS[0]);
  });

  it("selects the matching tier when the image equals its dimensions exactly", () => {
    // Given
    const image = { width: 816, height: 1110 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toEqual(MPC_TIERS[0]);
  });

  it("moves up to the next tier that contains both dimensions", () => {
    // Given
    const image = { width: 700, height: 1200 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toEqual(MPC_TIERS[1]);
  });

  it("reaches the largest tier for an image only it contains", () => {
    // Given
    const image = { width: 2500, height: 4000 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toEqual(MPC_TIERS[3]);
  });

  it("returns null when the image exceeds every tier", () => {
    // Given
    const image = { width: 3265, height: 4440 };

    // When
    const tier = selectTier(image);

    // Then
    expect(tier).toBeNull();
  });
});

describe("computePadLayout", () => {
  it("uses the tier as-is for the MPC default target", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.canvas).toEqual({ width: 816, height: 1110 });
  });

  it("centers a 745x1040 image at x 35, y 35 for the MPC default target", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.x).toBe(35);
    expect(layout?.y).toBe(35);
  });

  it("keeps the image at its native dimensions", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.image).toEqual({ width: 745, height: 1040 });
  });

  it("reports no cropped pixels for the MPC default target", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(0);
  });

  it.each([
    [MPC_TIERS[0], 816, 1013],
    [MPC_TIERS[1], 1632, 2026],
    [MPC_TIERS[2], 2176, 2701],
    [MPC_TIERS[3], 3264, 4052],
  ])(
    "crops the borderless canvas height at the %o tier",
    (tier, expectedWidth, expectedHeight) => {
      // Given an image that exactly fills the tier, forcing that tier's selection
      const image = { width: tier.width, height: tier.height };

      // When
      const layout = computePadLayout(image, BORDERLESS_TARGET);

      // Then
      expect(layout?.canvas).toEqual({
        width: expectedWidth,
        height: expectedHeight,
      });
    },
  );

  it("keeps the default image position in the cropped borderless canvas", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const defaultLayout = computePadLayout(image, DEFAULT_TARGET);
    const borderlessLayout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(borderlessLayout?.x).toBe(defaultLayout?.x);
    expect(borderlessLayout?.y).toBe(defaultLayout?.y);
  });

  it("reports the image pixels cut off below the borderless canvas bottom", () => {
    // Given
    const image = { width: 745, height: 1040 };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(62);
  });

  it("reports zero cropped pixels when the image fits the borderless canvas", () => {
    // Given
    const image = { width: 745, height: 900 };

    // When
    const layout = computePadLayout(image, BORDERLESS_TARGET);

    // Then
    expect(layout?.croppedPixels).toBe(0);
  });

  it("floors odd leftovers so offsets are always integers", () => {
    // Given an image whose leftover space is odd in both axes
    const image = { width: 815, height: 1109 };

    // When
    const layout = computePadLayout(image, DEFAULT_TARGET);

    // Then
    expect(layout?.x).toBe(0);
    expect(layout?.y).toBe(0);
  });

  it("returns null when no tier fits", () => {
    // Given
    const image = { width: 4000, height: 5000 };

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
