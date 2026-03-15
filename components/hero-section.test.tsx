import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("renders the welcome badge", () => {
    render(<HeroSection />);
    expect(screen.getByText("Image Outpainting Tool")).toBeDefined();
  });

  it("renders the title", () => {
    render(<HeroSection />);
    expect(
      screen.getByText("Prep, Outpaint, Merge"),
    ).toBeDefined();
  });

  it("renders the description", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(
        /Extend any image with Gemini AI/,
      ),
    ).toBeDefined();
  });

  it("renders the begin button with link", () => {
    render(<HeroSection />);
    expect(screen.getByText("Get Started")).toBeDefined();
  });
});
