import { render, screen } from "@testing-library/react";
import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
  it("renders the welcome badge", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("[data-slot='badge']")).not.toBeNull();
  });

  it("renders a top-level heading", () => {
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("renders a description paragraph", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("p")).not.toBeNull();
  });

  it("renders a CTA link to start the workflow", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/prep");
  });
});
