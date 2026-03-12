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

  it("applies active styling to the active step", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const items = container.querySelectorAll("li");
    expect(items[0].className).toContain("border-brand");
  });

  it("applies completed styling to completed steps", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["completed", "active", "upcoming"]} />,
    );

    const items = container.querySelectorAll("li");
    expect(items[0].className).toContain("border-muted");
  });

  it("applies upcoming styling with reduced opacity", () => {
    const { container } = render(
      <InstructionSteps stepStatuses={["active", "upcoming", "upcoming"]} />,
    );

    const items = container.querySelectorAll("li");
    expect(items[2].className).toContain("opacity-50");
  });
});
