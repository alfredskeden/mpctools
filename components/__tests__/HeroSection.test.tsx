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

  it("renders a primary CTA link to start the manual workflow", () => {
    render(<HeroSection />);
    const links = screen.getAllByRole("link");
    const prepLink = links.find((l) => l.getAttribute("href") === "/prep");
    expect(prepLink).not.toBeUndefined();
  });

  it("renders a secondary link to the automatic design workflow", () => {
    render(<HeroSection />);
    const links = screen.getAllByRole("link");
    const designLink = links.find((l) => l.getAttribute("href") === "/design");
    expect(designLink).not.toBeUndefined();
  });

  it("renders a secondary link to the Scryfall scan padder", () => {
    render(<HeroSection />);
    const links = screen.getAllByRole("link");
    const padderLink = links.find((l) => l.getAttribute("href") === "/padder");
    expect(padderLink).not.toBeUndefined();
  });
});
