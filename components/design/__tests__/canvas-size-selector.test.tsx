import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanvasSizeSelector } from "../canvas-size-selector";

describe("CanvasSizeSelector", () => {
  it("renders two canvas size options", () => {
    // When
    render(<CanvasSizeSelector selected={null} onSelect={vi.fn()} />);

    // Then
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("marks the selected button as pressed", () => {
    // When
    render(<CanvasSizeSelector selected="default" onSelect={vi.fn()} />);

    // Then
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(1);
  });

  it("calls onSelect with 'default' when first option is clicked", async () => {
    // Given
    const onSelect = vi.fn();
    render(<CanvasSizeSelector selected={null} onSelect={onSelect} />);
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    // Then
    expect(onSelect).toHaveBeenCalledWith("default");
  });

  it("calls onSelect with 'classic-borderless' when second option is clicked", async () => {
    // Given
    const onSelect = vi.fn();
    render(<CanvasSizeSelector selected={null} onSelect={onSelect} />);
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    // Then
    expect(onSelect).toHaveBeenCalledWith("classic-borderless");
  });

  it("renders with no selection", () => {
    // When
    render(<CanvasSizeSelector selected={null} onSelect={vi.fn()} />);

    // Then
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(0);
  });
});
