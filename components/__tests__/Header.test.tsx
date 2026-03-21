import { render, screen, within } from "@testing-library/react";
import { Header } from "../Header";

describe("Header", () => {
  it("renders the current step number", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    expect(screen.getByText("Step 1")).toBeDefined();
  });

  it("renders step 2 when on outpaint", () => {
    render(
      <Header
        currentStep={2}
        stepStatuses={["completed", "active", "upcoming"]}
      />,
    );

    expect(screen.getByText("Step 2")).toBeDefined();
  });

  it("renders step 3 when on merger", () => {
    render(
      <Header
        currentStep={3}
        stepStatuses={["completed", "completed", "active"]}
      />,
    );

    expect(screen.getByText("Step 3")).toBeDefined();
  });

  it("renders the page title for step 1", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("renders the page title for step 2", () => {
    render(
      <Header
        currentStep={2}
        stepStatuses={["completed", "active", "upcoming"]}
      />,
    );

    expect(screen.getByText("Outpaint with Gemini")).toBeDefined();
  });

  it("renders the page title for step 3", () => {
    render(
      <Header
        currentStep={3}
        stepStatuses={["completed", "completed", "active"]}
      />,
    );

    expect(screen.getByText("Merge Result")).toBeDefined();
  });

  it("renders the step indicator", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Build steps" }),
    ).toBeDefined();
  });

  it("marks active and completed steps in the indicator", () => {
    render(
      <Header
        currentStep={2}
        stepStatuses={["completed", "active", "upcoming"]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    const indicator = within(nav);
    expect(indicator.getByText("Prep").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(indicator.getByText("Outpaint").getAttribute("aria-current")).toBe(
      "step",
    );
    expect(
      indicator.getByText("Merge").getAttribute("aria-current"),
    ).toBeNull();
  });

  it("renders as a dark top bar with correct height", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    const header = screen.getByRole("banner");
    expect(header.className).toContain("h-11");
    expect(header.className).toContain("bg-surface-header");
    expect(header.className).toContain("border-surface-border");
  });

  it("renders step label with blue color", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    const stepLabel = screen.getByText("Step 1");
    expect(stepLabel.className).toContain("text-accent-blue");
    expect(stepLabel.className).toContain("font-semibold");
    expect(stepLabel.className).toContain("uppercase");
  });

  it("renders step indicator steps as navigation links", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toBe("/prep");
    expect(links[1].getAttribute("href")).toBe("/outpaint");
    expect(links[2].getAttribute("href")).toBe("/merger");
  });

  it("overrides default absolute positioning on StepIndicator", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Build steps" });
    expect(nav.className).toContain("relative");
    expect(nav.className).not.toContain("absolute");
  });
});
