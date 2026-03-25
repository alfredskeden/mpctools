import { render, screen, within } from "@testing-library/react";
import Home from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

describe("Home", () => {
  it("renders a main element", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeDefined();
  });

  it("renders the hero section with an h1 heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("renders the step indicator navigation", () => {
    render(<Home />);
    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("renders three step items in the navigation", () => {
    render(<Home />);
    const nav = screen.getByRole("navigation", { name: "Build steps" });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });
});
