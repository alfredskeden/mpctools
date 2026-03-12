import {
  calculateFitDimensions,
  calculateDrawParams,
  clampPosition,
  MIN_VISIBLE,
} from "./canvas-utils";

describe("calculateFitDimensions", () => {
  it("scales down a landscape image to fit container width", () => {
    const result = calculateFitDimensions(
      { width: 1000, height: 500 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 250 });
  });

  it("scales down a portrait image to fit container height", () => {
    const result = calculateFitDimensions(
      { width: 500, height: 1000 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 250, height: 500 });
  });

  it("scales up a small image to fit container", () => {
    const result = calculateFitDimensions(
      { width: 100, height: 50 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 250 });
  });

  it("returns exact container dimensions for matching aspect ratio", () => {
    const result = calculateFitDimensions(
      { width: 200, height: 200 },
      { width: 500, height: 500 },
    );

    expect(result).toEqual({ width: 500, height: 500 });
  });

  it("handles container smaller than image", () => {
    const result = calculateFitDimensions(
      { width: 800, height: 600 },
      { width: 400, height: 300 },
    );

    expect(result).toEqual({ width: 400, height: 300 });
  });
});

describe("calculateDrawParams", () => {
  it("centers an image on the canvas at scale 1", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0 },
      1,
    );

    expect(result).toEqual({
      sx: 0,
      sy: 0,
      sw: 200,
      sh: 100,
      dx: 100,
      dy: 150,
      dw: 200,
      dh: 100,
    });
  });

  it("applies position offset", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 50, y: -30 },
      1,
    );

    expect(result.dx).toBe(150);
    expect(result.dy).toBe(120);
  });

  it("applies scale factor", () => {
    const result = calculateDrawParams(
      { width: 200, height: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0 },
      2,
    );

    expect(result.dw).toBe(400);
    expect(result.dh).toBe(200);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(100);
  });
});

describe("clampPosition", () => {
  it("exports MIN_VISIBLE constant", () => {
    expect(MIN_VISIBLE).toBe(50);
  });

  it("allows movement when image is smaller than canvas", () => {
    // image 200x200, canvas 400x400
    // minOffset = 50 - (400 + 200) / 2 = 50 - 300 = -250
    // maxOffset = (400 + 200) / 2 - 50 = 300 - 50 = 250
    const result = clampPosition(
      { x: 100, y: 100 },
      { width: 200, height: 200 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("allows panning when image is larger than canvas", () => {
    const result = clampPosition(
      { x: 50, y: 50 },
      { width: 800, height: 800 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("clamps to maximum offset at boundary", () => {
    // image 600x600, canvas 400x400
    // maxOffset = (400 + 600) / 2 - 50 = 500 - 50 = 450
    const result = clampPosition(
      { x: 500, y: 500 },
      { width: 600, height: 600 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: 450, y: 450 });
  });

  it("clamps negative offset at boundary", () => {
    // minOffset = 50 - (400 + 600) / 2 = 50 - 500 = -450
    const result = clampPosition(
      { x: -500, y: -500 },
      { width: 600, height: 600 },
      { width: 400, height: 400 },
      1,
    );

    expect(result).toEqual({ x: -450, y: -450 });
  });

  it("accounts for scale when clamping", () => {
    // image 300x300 * scale 2 = 600x600, canvas 400x400
    // maxOffset = (400 + 600) / 2 - 50 = 450
    const result = clampPosition(
      { x: 500, y: 500 },
      { width: 300, height: 300 },
      { width: 400, height: 400 },
      2,
    );

    expect(result).toEqual({ x: 450, y: 450 });
  });
});
