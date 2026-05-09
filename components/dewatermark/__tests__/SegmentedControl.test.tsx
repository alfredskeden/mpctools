import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "@/components/dewatermark/SegmentedControl";

const CORNERS = [
  { id: "auto", label: "Auto" },
  { id: "tl", label: "TL" },
  { id: "tr", label: "TR" },
  { id: "bl", label: "BL" },
  { id: "br", label: "BR" },
] as const;

describe("SegmentedControl", () => {
  it("renders one radio per option and marks the active one with aria-checked", () => {
    // Given/When
    render(
      <SegmentedControl
        options={[...CORNERS]}
        value="tl"
        onChange={() => {}}
        ariaLabel="Corner"
      />,
    );

    // Then
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(
      radios.find((r) => r.getAttribute("aria-checked") === "true"),
    ).toBe(radios[1]);
  });

  it("calls onChange with the option id when clicked", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={[...CORNERS]}
        value="auto"
        onChange={onChange}
        ariaLabel="Corner"
      />,
    );

    // When
    await user.click(screen.getAllByRole("radio")[3]);

    // Then
    expect(onChange).toHaveBeenCalledExactlyOnceWith("bl");
  });

  it("does not call onChange when disabled", async () => {
    // Given
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={[...CORNERS]}
        value="auto"
        onChange={onChange}
        disabled
        ariaLabel="Corner"
      />,
    );

    // When
    await user.click(screen.getAllByRole("radio")[2]);

    // Then
    expect(onChange).not.toHaveBeenCalled();
  });
});
