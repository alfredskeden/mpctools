import { render, screen } from "@testing-library/react";
import { PrepHeader } from "./prep-header";

describe("PrepHeader", () => {
  it("renders the STEP 1 badge", () => {
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

  it("overrides default absolute positioning on StepIndicator", () => {
    render(<PrepHeader stepStatuses={["active", "upcoming", "upcoming"]} />);

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });
});
