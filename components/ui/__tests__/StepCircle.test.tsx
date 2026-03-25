import { render } from "@testing-library/react";
import { StepCircle } from "../StepCircle";

describe("StepCircle", () => {
  it("renders the step number when active", () => {
    const { container } = render(<StepCircle status="active" number={1} />);

    const circle = container.querySelector("[data-status='active']")!;
    expect(circle).not.toBeNull();
    expect(circle.textContent).toBe("1");
    expect(circle.querySelector("svg")).toBeNull();
  });

  it("renders a checkmark icon when completed", () => {
    const { container } = render(<StepCircle status="completed" number={1} />);

    const circle = container.querySelector("[data-status='completed']")!;
    expect(circle).not.toBeNull();
    expect(circle.querySelector("svg")).toBeDefined();
    expect(circle.textContent?.trim()).toBe("");
  });

  it("renders the step number with upcoming status when upcoming", () => {
    const { container } = render(<StepCircle status="upcoming" number={3} />);

    const circle = container.querySelector("[data-status='upcoming']")!;
    expect(circle).not.toBeNull();
    expect(circle.textContent).toBe("3");
    expect(circle.querySelector("svg")).toBeNull();
  });
});
