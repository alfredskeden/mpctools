import { render, screen } from "@testing-library/react";
import { PrepHeader } from "./prep-header";

describe("PrepHeader", () => {
  it("renders the STEP 1 text", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(screen.getByText("STEP 1")).toBeDefined();
  });

  it("renders the page title", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("renders the step indicator", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("marks active and completed steps in the indicator", () => {
    render(<PrepHeader stepStatuses={["completed", "active", "upcoming"]} />);

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });

  it("renders as a dark top bar with correct height", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("h-11");
    expect(header.className).toContain("bg-surface-raised");
    expect(header.className).toContain("border-surface-border");
  });

  it("renders STEP 1 with blue color", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    const stepLabel = screen.getByText("STEP 1");
    expect(stepLabel.className).toContain("text-accent-blue");
    expect(stepLabel.className).toContain("font-semibold");
  });

  it("overrides default absolute positioning on StepIndicator", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });
});
