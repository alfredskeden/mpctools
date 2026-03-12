import { render, screen } from "@testing-library/react";
import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("renders the welcome badge", () => {
    render(<HeroSection />);
    expect(screen.getByText("Welcome to")).toBeDefined();
  });

  it("renders the title", () => {
    render(<HeroSection />);
    expect(
      screen.getByText("All-in-One MTG Playtest Card Builder"),
    ).toBeDefined();
  });

  it("renders the description", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(
        /Prepare, outpaint, and merge high-quality card art/,
      ),
    ).toBeDefined();
  });

  it("renders the begin button with link", () => {
    render(<HeroSection />);
    expect(screen.getByText("Begin Step 1")).toBeDefined();
  });
});
