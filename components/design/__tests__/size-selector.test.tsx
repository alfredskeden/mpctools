import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SizeSelector } from "../size-selector";

describe("SizeSelector", () => {
  it("renders four size options", () => {
    // When
    render(<SizeSelector selected={null} onSelect={vi.fn()} />);

    // Then
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("marks the selected button as pressed", () => {
    // When
    render(<SizeSelector selected="tall" onSelect={vi.fn()} />);

    // Then
    const buttons = screen.getAllByRole("button");
    const tallButton = buttons.find(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(tallButton).toBeDefined();
  });

  it("calls onSelect when a button is clicked", async () => {
    // Given
    const onSelect = vi.fn();
    render(<SizeSelector selected={null} onSelect={onSelect} />);
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[2]); // "Normal"

    // Then
    expect(onSelect).toHaveBeenCalledWith("normal");
  });

  it("renders with no selection", () => {
    // When
    render(<SizeSelector selected={null} onSelect={vi.fn()} />);

    // Then
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(0);
  });
});
