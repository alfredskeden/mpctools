import { render, screen } from "@testing-library/react";
import DewatermarkPage, { metadata } from "./page";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("DewatermarkPage", () => {
  it("renders the slim header navigation", () => {
    // Given/When
    render(<DewatermarkPage />);

    // Then
    expect(
      screen.getByRole("navigation", { name: "MPC Tools sections" }),
    ).toBeDefined();
  });

  it("starts in the empty state", () => {
    // Given/When
    render(<DewatermarkPage />);

    // Then
    expect(screen.getByTestId("dewatermark-empty-card")).toBeDefined();
  });

  it("exposes a descriptive page title and description in metadata", () => {
    // Then
    expect(metadata.title).toContain("Dewatermark");
    expect(typeof metadata.description).toBe("string");
  });
});
