import { render, screen, within } from "@testing-library/react";
import { LandingFooter } from "../landing-footer";

describe("LandingFooter", () => {
  it("renders a footer contentinfo landmark", () => {
    render(<LandingFooter />);
    expect(screen.getByRole("contentinfo")).toBeDefined();
  });

  it("renders footer navigation landmark", () => {
    render(<LandingFooter />);
    expect(
      screen.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeDefined();
  });

  it("renders three navigation links for workflow steps", () => {
    render(<LandingFooter />);
    const nav = screen.getByRole("navigation", { name: "Footer navigation" });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
  });

  it("renders links for each workflow step", () => {
    render(<LandingFooter />);
    const nav = screen.getByRole("navigation", { name: "Footer navigation" });
    const links = within(nav).getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/prep");
    expect(hrefs).toContain("/outpaint");
    expect(hrefs).toContain("/merger");
  });
});
