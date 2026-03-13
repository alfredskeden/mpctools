import { render, screen } from "@testing-library/react";
import { StepIndicator } from "./step-indicator";

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

describe("StepIndicator", () => {
  it("renders a nav with the correct aria-label", () => {
    render(<StepIndicator steps={steps} />);

    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("renders all step labels (hidden on mobile)", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Prep")).toBeDefined();
    expect(screen.getByText("Outpaint")).toBeDefined();
    expect(screen.getByText("Merge")).toBeDefined();
  });

  it("marks the active step with aria-current", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(
      screen.getByText("Outpaint").getAttribute("aria-current"),
    ).toBeNull();
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });

  it("applies active styling classes to the active step label", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Prep").className).toContain("text-accent-blue");
    expect(screen.getByText("Prep").className).toContain("font-medium");
  });

  it("applies inactive styling classes to inactive step labels", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Outpaint").className).toContain("text-text-tertiary");
    expect(screen.getByText("Outpaint").className).toContain("font-normal");
  });

  it("hides labels on mobile with hidden sm:inline", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Prep").className).toContain("hidden");
    expect(screen.getByText("Prep").className).toContain("sm:inline");
  });

  it("renders separators between steps but not after the last", () => {
    const { container } = render(<StepIndicator steps={steps} />);

    const separators = container.querySelectorAll("[role='separator']");
    expect(separators).toHaveLength(2);
  });

  it("renders step dots with correct active/inactive styles", () => {
    const { container } = render(<StepIndicator steps={steps} />);

    const dots = container.querySelectorAll(
      "[aria-hidden='true'].rounded-full",
    );
    expect(dots).toHaveLength(3);
    expect(dots[0].className).toContain("bg-accent-blue");
    expect(dots[1].className).toContain("bg-surface-subtle");
    expect(dots[2].className).toContain("bg-surface-subtle");
  });

  it("renders an ordered list of steps", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByRole("list")).toBeDefined();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders no separators for a single step", () => {
    const { container } = render(
      <StepIndicator steps={[{ label: "Prep", active: true }]} />,
    );

    const separators = container.querySelectorAll("[role='separator']");
    expect(separators).toHaveLength(0);
  });

  it("applies default className when no className prop is given", () => {
    render(<StepIndicator steps={steps} />);

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("absolute");
    expect(nav.className).toContain("bottom-12");
  });

  it("merges custom className with defaults", () => {
    render(<StepIndicator steps={steps} className="relative bottom-0" />);

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });

  it("supports multiple active steps", () => {
    const multiActive = [
      { label: "Prep", active: true },
      { label: "Outpaint", active: true },
      { label: "Merge", active: false },
    ];
    render(<StepIndicator steps={multiActive} />);

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });
});
