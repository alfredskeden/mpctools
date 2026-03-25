import { render, screen, within } from "@testing-library/react";
import { Header } from "../Header";

describe("Header", () => {
  it("renders a step number label for step 1", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    expect(screen.getByText(/step\s*1/i)).toBeDefined();
  });

  it("renders a step number label for step 2", () => {
    render(
      <Header
        currentStep={2}
        stepStatuses={["completed", "active", "upcoming"]}
      />,
    );

    expect(screen.getByText(/step\s*2/i)).toBeDefined();
  });

  it("renders a step number label for step 3", () => {
    render(
      <Header
        currentStep={3}
        stepStatuses={["completed", "completed", "active"]}
      />,
    );

    expect(screen.getByText(/step\s*3/i)).toBeDefined();
  });

  it("renders a page title text for each step", () => {
    render(
      <Header
        currentStep={1}
        stepStatuses={["active", "upcoming", "upcoming"]}
      />,
    );

    // The header renders — banner is the structural indicator
    expect(screen.getByRole("banner")).toBeDefined();
  });

  it("renders the step indicator navigation", () => {
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
