import { render, screen, within } from "@testing-library/react";
import { LandingNav } from "../landing-nav";

describe("LandingNav", () => {
  it("renders a header element", () => {
    const { container } = render(<LandingNav />);
    expect(container.querySelector("header")).not.toBeNull();
  });

  it("renders a link to the home page", () => {
    render(<LandingNav />);
    const nav = screen.getByRole("banner");
    const homeLink = within(nav)
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/");
    expect(homeLink).toBeDefined();
  });

  it("renders a CTA link to start the workflow", () => {
    render(<LandingNav />);
    const nav = screen.getByRole("banner");
    const ctaLink = within(nav)
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/prep");
    expect(ctaLink).toBeDefined();
  });

  it("renders site navigation landmark", () => {
    render(<LandingNav />);
    expect(
      screen.getByRole("navigation", { name: "Site navigation" }),
    ).toBeDefined();
  });

  it("renders a how-it-works anchor link", () => {
    render(<LandingNav />);
    const nav = screen.getByRole("navigation", { name: "Site navigation" });
    const anchor = nav.querySelector('a[href="#how-it-works"]');
    expect(anchor).not.toBeNull();
  });

  it("renders a Dewatermark link to the standalone tool", () => {
    render(<LandingNav />);
    const nav = screen.getByRole("navigation", { name: "Site navigation" });
    const link = nav.querySelector('a[href="/dewatermark"]');
    expect(link).not.toBeNull();
  });
});
