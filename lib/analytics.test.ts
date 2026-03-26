import { track } from "./analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("calls window.umami.track with event name and data", () => {
    // Given
    const mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });

    // When
    track("prep_image_uploaded", { fileName: "card.png", width: 100, height: 100 });

    // Then
    expect(mockTrack).toHaveBeenCalledWith("prep_image_uploaded", {
      fileName: "card.png",
      width: 100,
      height: 100,
    });
  });

  it("calls window.umami.track with only event name when no data provided", () => {
    // Given
    const mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });

    // When
    track("prep_image_positioned");

    // Then
    expect(mockTrack).toHaveBeenCalledWith("prep_image_positioned", undefined);
  });

  it("does not throw when window.umami is undefined", () => {
    // Given — window.umami is not set

    // When / Then
    expect(() => track("prep_image_positioned")).not.toThrow();
  });
});
