import { render, screen } from "@testing-library/react";
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

  it("renders the hero section", () => {
    render(<Home />);
    expect(
      screen.getByText("All-in-One MTG Playtest Card Builder"),
    ).toBeDefined();
  });

  it("renders the step indicator", () => {
    render(<Home />);
    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("renders step labels", () => {
    render(<Home />);
    expect(screen.getByText("Prep")).toBeDefined();
    expect(screen.getByText("Outpaint")).toBeDefined();
    expect(screen.getByText("Merge")).toBeDefined();
  });
});
