import { render } from "@testing-library/react";
import { Separator } from "../Separator";

describe(Separator.name, () => {
  it("renders with separator slot", () => {
    const { container } = render(<Separator />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep).toBeDefined();
    expect(sep).not.toBeNull();
  });

  it("defaults to horizontal orientation", () => {
    const { container } = render(<Separator />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep?.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("supports vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep?.getAttribute("data-orientation")).toBe("vertical");
  });

  it("is decorative by default", () => {
    const { container } = render(<Separator />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep?.getAttribute("role")).toBe("none");
  });

  it("renders as separator role when not decorative", () => {
    const { container } = render(<Separator decorative={false} />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep?.getAttribute("role")).toBe("separator");
  });

  it("merges custom className", () => {
    const { container } = render(<Separator className="custom-class" />);

    const sep = container.querySelector("[data-slot='separator']");
    expect(sep?.className).toContain("custom-class");
  });
});
