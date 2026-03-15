import { render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders as a button element by default", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("renders with default variant and size data attributes", () => {
    render(<Button>Click me</Button>);

    const btn = screen.getByRole("button");
    expect(btn.getAttribute("data-variant")).toBe("default");
    expect(btn.getAttribute("data-size")).toBe("default");
  });

  it("renders children as the root element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Link button" });
    expect(link.getAttribute("href")).toBe("/test");
    expect(link.getAttribute("data-slot")).toBe("button");
  });

  it("applies variant prop to data-variant", () => {
    render(<Button variant="outline">Outlined</Button>);

    expect(screen.getByRole("button").getAttribute("data-variant")).toBe(
      "outline",
    );
  });

  it("applies size prop to data-size", () => {
    render(<Button size="lg">Large</Button>);

    expect(screen.getByRole("button").getAttribute("data-size")).toBe("lg");
  });
});
