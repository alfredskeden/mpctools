import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TargetSelector } from "../target-selector";
import { computePadLayout, PAD_TARGETS } from "@/lib/padder-math";

const layoutFor = (
  target = PAD_TARGETS[0],
  image = { width: 745, height: 1040 },
) => computePadLayout(image, target)!;

describe("TargetSelector", () => {
  it("offers one option per declared pad target", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[0].id}
        layout={layoutFor()}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.getAllByRole("radio")).toHaveLength(PAD_TARGETS.length);
  });

  it("marks the selected target through an ARIA state attribute", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[1].id}
        layout={layoutFor(PAD_TARGETS[1])}
        onSelect={vi.fn()}
      />,
    );

    // Then
    const options = screen.getAllByRole("radio");
    expect(options.map((option) => option.getAttribute("aria-checked"))).toEqual(
      ["false", "true"],
    );
  });

  it("reports the resulting canvas dimensions and ratio label", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[0].id}
        layout={layoutFor()}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.getByTestId("target-width").textContent).toBe("816");
    expect(screen.getByTestId("target-height").textContent).toBe("1110");
    expect(screen.getByTestId("target-ratio").textContent).toBe("11:15");
  });

  it("reports the cropped canvas for the borderless target", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[1].id}
        layout={layoutFor(PAD_TARGETS[1])}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.getByTestId("target-height").textContent).toBe("1013");
    expect(screen.getByTestId("target-ratio").textContent).toBe("29:36");
  });

  it("surfaces the cropped pixel count when it is non-zero", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[1].id}
        layout={layoutFor(PAD_TARGETS[1])}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.getByTestId("crop-note").textContent).toContain("62");
  });

  it("hides the cropped pixel count when nothing is cut off", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[1].id}
        layout={layoutFor(PAD_TARGETS[1], { width: 745, height: 900 })}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.queryByTestId("crop-note")).toBeNull();
  });

  it("renders no read-out when there is no layout", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[0].id}
        layout={null}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.queryByTestId("target-width")).toBeNull();
    expect(screen.queryByTestId("crop-note")).toBeNull();
  });

  it("reports the chosen target back to the caller", async () => {
    // Given
    const onSelect = vi.fn();
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[0].id}
        layout={layoutFor()}
        onSelect={onSelect}
      />,
    );

    // When
    await userEvent.click(screen.getAllByRole("radio")[1]);

    // Then
    expect(onSelect).toHaveBeenCalledWith(PAD_TARGETS[1].id);
  });

  it("exposes no control that scales or moves the image", () => {
    // Given / When
    render(
      <TargetSelector
        selectedId={PAD_TARGETS[0].id}
        layout={layoutFor()}
        onSelect={vi.fn()}
      />,
    );

    // Then
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });
});
