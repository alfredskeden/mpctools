import { render, screen } from "@testing-library/react";
import { StepIndicator } from "../StepIndicator";

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

  it("renders all step labels", () => {
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

  it("shows label for the active step and no aria-current for inactive", () => {
    render(<StepIndicator steps={steps} />);

    // Active: has aria-current
    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    // Inactive: no aria-current
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBeNull();
  });

  it("always shows step labels", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.getByText("Prep")).toBeDefined();
  });

  it("renders steps as links when href is provided", () => {
    const stepsWithHref = [
      { label: "Prep", active: true, href: "/prep" },
      { label: "Outpaint", active: false, href: "/outpaint" },
      { label: "Merge", active: false, href: "/merger" },
    ];
    render(<StepIndicator steps={stepsWithHref} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toBe("/prep");
    expect(links[1].getAttribute("href")).toBe("/outpaint");
    expect(links[2].getAttribute("href")).toBe("/merger");
  });

  it("renders steps without links when href is not provided", () => {
    render(<StepIndicator steps={steps} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders separators between steps but not after the last", () => {
    const { container } = render(<StepIndicator steps={steps} />);

    const separators = container.querySelectorAll("[role='separator']");
    expect(separators).toHaveLength(2);
  });

  it("renders dot indicators with active dot marked", () => {
    const { container } = render(<StepIndicator steps={steps} />);

    const dots = container.querySelectorAll("[data-active]");
    expect(dots.length).toBeGreaterThanOrEqual(3);
    expect(dots[0].getAttribute("data-active")).toBe("true");
    expect(dots[1].getAttribute("data-active")).toBe("false");
    expect(dots[2].getAttribute("data-active")).toBe("false");
  });

  it("updates dot indicators when active step changes", () => {
    const allActive = [
      { label: "Prep", active: true },
      { label: "Outpaint", active: true },
      { label: "Merge", active: false },
    ];
    const { container } = render(<StepIndicator steps={allActive} />);

    const dots = container.querySelectorAll("[data-active]");
    expect(dots[0].getAttribute("data-active")).toBe("true");
    expect(dots[1].getAttribute("data-active")).toBe("true");
    expect(dots[2].getAttribute("data-active")).toBe("false");
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

  it("merges custom className to override defaults", () => {
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
