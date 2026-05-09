import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Toggle } from "@/components/dewatermark/Toggle";

describe("Toggle", () => {
  it("exposes its checked state via aria-checked", () => {
    // Given/When
    render(
      <Toggle checked ariaLabel="Adaptive" onChange={() => {}} />,
    );

    // Then
    expect(
      screen.getByRole("switch", { name: "Adaptive" }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("flips to the opposite value when clicked", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} ariaLabel="Adaptive" onChange={onChange} />);

    // When
    await user.click(screen.getByRole("switch", { name: "Adaptive" }));

    // Then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("does not call onChange when disabled", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle
        checked={false}
        disabled
        ariaLabel="Adaptive"
        onChange={onChange}
      />,
    );

    // When
    await user.click(screen.getByRole("switch", { name: "Adaptive" }));

    // Then
    expect(onChange).not.toHaveBeenCalled();
  });
});
