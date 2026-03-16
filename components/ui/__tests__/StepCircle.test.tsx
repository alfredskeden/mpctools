import { render } from "@testing-library/react";
import { StepCircle } from "../StepCircle";

describe("StepCircle", () => {
  it("renders the step number when active", () => {
    const { container } = render(<StepCircle status="active" number={1} />);

    const circle = container.querySelector(".rounded-full")!;
    expect(circle.textContent).toBe("1");
    expect(circle.className).toContain("bg-accent-blue");
    expect(circle.className).toContain("text-white");
  });

  it("renders a green checkmark when completed", () => {
    const { container } = render(<StepCircle status="completed" number={1} />);

    const circle = container.querySelector(".rounded-full")!;
    expect(circle.className).toContain("bg-status-success-dark");
    expect(circle.textContent).not.toBe("1");
    expect(circle.querySelector("svg")).toBeDefined();
  });

  it("renders the step number with muted styling when upcoming", () => {
    const { container } = render(<StepCircle status="upcoming" number={3} />);

    const circle = container.querySelector(".rounded-full")!;
    expect(circle.textContent).toBe("3");
    expect(circle.className).toContain("border-surface-muted");
    expect(circle.className).toContain("text-text-tertiary");
  });
});
