import { render, screen } from "@testing-library/react";
import { Header } from "./header";

describe("Header", () => {
  it("renders the current step number", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(screen.getByText("STEP 1")).toBeDefined();
  });

  it("renders step 2 when on outpaint", () => {
    render(
      <Header currentStep={2} stepStatuses={["completed", "active", "upcoming"]} />,
    );

    expect(screen.getByText("STEP 2")).toBeDefined();
  });

  it("renders step 3 when on merger", () => {
    render(
      <Header currentStep={3} stepStatuses={["completed", "completed", "active"]} />,
    );

    expect(screen.getByText("STEP 3")).toBeDefined();
  });

  it("renders the page title for step 1", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("renders the page title for step 2", () => {
    render(
      <Header currentStep={2} stepStatuses={["completed", "active", "upcoming"]} />,
    );

    expect(screen.getByText("Outpaint Image")).toBeDefined();
  });

  it("renders the page title for step 3", () => {
    render(
      <Header currentStep={3} stepStatuses={["completed", "completed", "active"]} />,
    );

    expect(screen.getByText("Merge Cards")).toBeDefined();
  });

  it("renders the step indicator", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("marks active and completed steps in the indicator", () => {
    render(
      <Header currentStep={2} stepStatuses={["completed", "active", "upcoming"]} />,
    );

    expect(screen.getByText("Prep").getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("Outpaint").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByText("Merge").getAttribute("aria-current")).toBeNull();
  });

  it("renders as a dark top bar with correct height", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const header = screen.getByRole("banner");
    expect(header.className).toContain("h-11");
    expect(header.className).toContain("bg-surface-raised");
    expect(header.className).toContain("border-surface-border");
  });

  it("renders step label with blue color", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const stepLabel = screen.getByText("STEP 1");
    expect(stepLabel.className).toContain("text-accent-blue");
    expect(stepLabel.className).toContain("font-semibold");
  });

  it("overrides default absolute positioning on StepIndicator", () => {
    render(
      <Header currentStep={1} stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });
});
