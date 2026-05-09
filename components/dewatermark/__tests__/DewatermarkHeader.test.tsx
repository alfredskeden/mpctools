import { render, screen } from "@testing-library/react";

import { DewatermarkHeader } from "@/components/dewatermark/DewatermarkHeader";

describe("DewatermarkHeader", () => {
  it("links the brand to the home page", () => {
    // Given/When
    render(<DewatermarkHeader />);

    // Then
    expect(
      screen.getByRole("link", { name: "mpctools home" }).getAttribute("href"),
    ).toBe("/");
  });

  it("exposes a navigation landmark with all four tool links", () => {
    // Given/When
    render(<DewatermarkHeader />);
    const nav = screen.getByRole("navigation", { name: "MPC Tools sections" });

    // Then
    expect(
      nav.querySelectorAll("a").length,
    ).toBe(4);
  });

  it("marks the Dewatermark link as the current page", () => {
    // Given/When
    render(<DewatermarkHeader />);
    const links = screen
      .getByRole("navigation", { name: "MPC Tools sections" })
      .querySelectorAll("a");

    // Then
    const current = Array.from(links).find(
      (a) => a.getAttribute("aria-current") === "page",
    );
    expect(current?.getAttribute("href")).toBe("/dewatermark");
  });
});
