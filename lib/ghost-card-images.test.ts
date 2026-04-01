import { describe, it, expect, vi, afterEach } from "vitest";
import { getGhostCardImageSets } from "./ghost-card-images";

describe("getGhostCardImageSets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns two image sets each containing three paths", () => {
    const [left, right] = getGhostCardImageSets();
    expect(left).toHaveLength(3);
    expect(right).toHaveLength(3);
  });

  it("returns distinct sets when b-candidate is bumped up past a", () => {
    // a = floor(0.4 * 6) = 2, b-candidate = floor(0.4 * 5) = 2, 2 >= 2 → b++ = 3
    let call = 0;
    vi.spyOn(Math, "random").mockImplementation(() => (call++ === 0 ? 0.4 : 0.4));
    const [left, right] = getGhostCardImageSets();
    expect(left[0]).toBe("/outpaint-animation/2_prepper.webp");
    expect(right[0]).toBe("/outpaint-animation/3_prepper.webp");
  });

  it("returns distinct sets when b-candidate is already less than a", () => {
    // a = floor(0.9 * 6) = 5, b-candidate = floor(0.1 * 5) = 0, 0 < 5 → no change
    let call = 0;
    vi.spyOn(Math, "random").mockImplementation(() => (call++ === 0 ? 0.9 : 0.1));
    const [left, right] = getGhostCardImageSets();
    expect(left[0]).toBe("/outpaint-animation/5_prepper.webp");
    expect(right[0]).toBe("/outpaint-animation/0_prepper.webp");
  });
});
