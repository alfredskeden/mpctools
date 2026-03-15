import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Test</Badge>);

    const badge = screen.getByText("Test");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.getAttribute("data-variant")).toBe("default");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);

    expect(screen.getByText("Secondary").getAttribute("data-variant")).toBe(
      "secondary",
    );
  });

  it("renders as a Slot when asChild is true", () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>,
    );

    const link = screen.getByText("Link Badge");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("data-slot")).toBe("badge");
  });

  it("renders as span when asChild is false", () => {
    render(<Badge>Span Badge</Badge>);

    expect(screen.getByText("Span Badge").tagName).toBe("SPAN");
  });

  it("merges custom className", () => {
    render(<Badge className="custom-class">Styled</Badge>);

    expect(screen.getByText("Styled").className).toContain("custom-class");
  });
});
