import { render, screen } from "@testing-library/react";
import { Header } from "./header";

describe("Header", () => {
  it("renders the STEP 1 text", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(screen.getByText("STEP 1")).toBeDefined();
  });

  it("renders the page title", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("renders the step indicator", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("marks active and completed steps in the indicator", () => {
    render(<Header stepStatuses={["completed", "active", "upcoming"]} />);

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });

  it("renders as a dark top bar with correct height", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("h-11");
    expect(header.className).toContain("bg-surface-raised");
    expect(header.className).toContain("border-surface-border");
  });

  it("renders STEP 1 with blue color", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    const stepLabel = screen.getByText("STEP 1");
    expect(stepLabel.className).toContain("text-accent-blue");
    expect(stepLabel.className).toContain("font-semibold");
  });

  it("overrides default absolute positioning on StepIndicator", () => {
    render(<Header stepStatuses={["active", "upcoming", "upcoming"]} />);

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });
});
