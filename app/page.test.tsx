import { render, screen, within } from "@testing-library/react";
import Home from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/lib/ghost-card-images", () => ({
  getGhostCardImageSets: () => [
    [
      "/outpaint-animation/0/prepper.webp",
      "/outpaint-animation/0/outpaint.webp",
      "/outpaint-animation/0/full_card.webp",
    ],
    [
      "/outpaint-animation/1/prepper.webp",
      "/outpaint-animation/1/outpaint.webp",
      "/outpaint-animation/1/full_card.webp",
    ],
  ],
}));

describe("Home", () => {
  it("renders a main element", async () => {
    render(await Home());
    expect(screen.getByRole("main")).toBeDefined();
  });

  it("renders the hero section with an h1 heading", async () => {
    render(await Home());
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("renders the step indicator navigation", async () => {
    render(await Home());
    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("renders three step items in the navigation", async () => {
    render(await Home());
    const nav = screen.getByRole("navigation", { name: "Build steps" });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders two ghost card decorations", async () => {
    const { container } = render(await Home());
    expect(container.querySelectorAll("[data-side]")).toHaveLength(2);
  });
});
