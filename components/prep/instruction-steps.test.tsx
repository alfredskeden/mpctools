import { render, screen } from "@testing-library/react";
import { InstructionSteps } from "./instruction-steps";

describe("InstructionSteps", () => {
  it("renders an aside with instructions label", () => {
    render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(screen.getByRole("complementary", { name: "Instructions" })).toBeDefined();
  });

  it("renders three instruction steps", () => {
    render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders step titles", () => {
    render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(screen.getByText("Upload card art")).toBeDefined();
    expect(screen.getByText("Position on canvas")).toBeDefined();
    expect(screen.getByText("Download prepared image")).toBeDefined();
  });

  it("renders step descriptions", () => {
    render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    expect(
      screen.getByText(
        "Drag and drop or click to browse for your card image.",
      ),
    ).toBeDefined();
  });

  it("renders numbered circles instead of icons", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles).toHaveLength(3);
    expect(circles[0].textContent).toBe("1");
    expect(circles[1].textContent).toBe("2");
    expect(circles[2].textContent).toBe("3");
  });

  it("applies active styling to the active step circle", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[0].className).toContain("bg-accent-blue");
    expect(circles[0].className).toContain("text-white");
  });

  it("applies completed styling to completed step circles", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["completed", "active", "upcoming"]} />,
    );

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[0].className).toContain("bg-accent-blue");
  });

  it("applies upcoming styling to upcoming step circles", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const circles = container.querySelectorAll(".rounded-full");
    expect(circles[2].className).toContain("border-surface-muted");
    expect(circles[2].className).toContain("text-text-tertiary");
  });

  it("applies correct text colors based on status", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const items = container.querySelectorAll("li");
    const activeTitle = items[0].querySelector("p");
    const upcomingTitle = items[2].querySelector("p");

    expect(activeTitle?.className).toContain("text-text-primary");
    expect(upcomingTitle?.className).toContain("text-text-secondary");
  });
});
