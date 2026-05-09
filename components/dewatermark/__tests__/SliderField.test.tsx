import { fireEvent, render, screen } from "@testing-library/react";

import { SliderField } from "@/components/dewatermark/SliderField";

describe("SliderField", () => {
  it("renders the formatted value next to the slider", () => {
    // Given/When
    render(
      <SliderField
        label="Mask expansion"
        value={6}
        min={0}
        max={20}
        step={1}
        onChange={() => {}}
        format={(v) => `${v} px`}
      />,
    );

    // Then
    const slider = screen.getByLabelText("Mask expansion");
    expect(slider.getAttribute("value")).toBe("6");
    expect(screen.getByText("6 px")).toBeDefined();
  });

  it("emits the parsed numeric value on change", () => {
    // Given
    const onChange = vi.fn();
    render(
      <SliderField
        label="Feather"
        value={0.2}
        min={0}
        max={1}
        step={0.01}
        onChange={onChange}
      />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Feather"), {
      target: { value: "0.42" },
    });

    // Then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(0.42);
  });

  it("ignores user changes when disabled", () => {
    // Given
    const onChange = vi.fn();
    render(
      <SliderField
        label="Alpha"
        value={1}
        min={0}
        max={2}
        step={0.1}
        disabled
        onChange={onChange}
      />,
    );

    // Then
    const slider = screen.getByLabelText("Alpha") as HTMLInputElement;
    expect(slider.disabled).toBe(true);
  });

  it("falls back to String(value) when no format function is provided", () => {
    // Given/When
    render(
      <SliderField
        label="Plain"
        value={3}
        min={0}
        max={5}
        step={1}
        onChange={() => {}}
      />,
    );

    // Then
    expect(screen.getByText("3")).toBeDefined();
  });
});
