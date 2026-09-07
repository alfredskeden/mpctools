import { render, screen } from "@testing-library/react";
import { PadderShell } from "../padder-shell";

describe("PadderShell", () => {
  it("renders its children", () => {
    // Given / When
    render(
      <PadderShell currentStep={1}>
        <p data-testid="child" />
      </PadderShell>,
    );

    // Then
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("links back home", () => {
    // Given / When
    render(<PadderShell currentStep={1}>{null}</PadderShell>);

    // Then
    expect(screen.getByTestId("padder-home-link").getAttribute("href")).toBe(
      "/",
    );
  });

  it("exposes a two-step indicator", () => {
    // Given / When
    render(<PadderShell currentStep={1}>{null}</PadderShell>);

    // Then
    const steps = screen.getAllByTestId(/^padder-step-/);
    expect(steps).toHaveLength(2);
  });

  it("lets the user move between the two padder routes from the header", () => {
    // Given / When
    render(<PadderShell currentStep={1}>{null}</PadderShell>);

    // Then
    const steps = screen.getAllByTestId(/^padder-step-/);
    expect(steps.map((step) => step.getAttribute("href"))).toEqual([
      "/padder",
      "/padder-scrub",
    ]);
  });

  it("marks the current step through an ARIA state attribute", () => {
    // Given / When
    render(<PadderShell currentStep={2}>{null}</PadderShell>);

    // Then
    const steps = screen.getAllByTestId(/^padder-step-/);
    expect(steps.map((step) => step.getAttribute("aria-current"))).toEqual([
      "false",
      "step",
    ]);
  });

  it("does not render the three-step prep workflow indicator", () => {
    // Given / When
    render(<PadderShell currentStep={1}>{null}</PadderShell>);

    // Then
    expect(screen.queryByRole("navigation", { name: "Build steps" })).toBeNull();
    expect(screen.getAllByTestId(/^padder-step-/)).toHaveLength(2);
  });
});
