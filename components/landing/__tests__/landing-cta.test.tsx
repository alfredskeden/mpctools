import { render, screen } from "@testing-library/react";
import { LandingCta } from "../landing-cta";

describe("LandingCta", () => {
  it("renders a section heading", () => {
    render(<LandingCta />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders a CTA link to start the workflow", () => {
    render(<LandingCta />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/prep");
  });
});
