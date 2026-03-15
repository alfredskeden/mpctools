import { render, screen, fireEvent } from "@testing-library/react";
import { OverlaySelector } from "../overlay-selector";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const defaultProps = {
  selectedOverlays: [] as string[],
  onToggleOverlay: vi.fn(),
};

describe("OverlaySelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all overlay options as checkboxes", () => {
    render(<OverlaySelector {...defaultProps} />);

    for (const option of OVERLAY_OPTIONS) {
      expect(screen.getByText(option.label)).toBeDefined();
    }
    expect(screen.getAllByRole("checkbox")).toHaveLength(OVERLAY_OPTIONS.length);
  });

  it("renders with group role", () => {
    render(<OverlaySelector {...defaultProps} />);

    expect(
      screen.getByRole("group", { name: "Overlay options" }),
    ).toBeDefined();
  });

  it("checks checkboxes for selected overlays", () => {
    render(<OverlaySelector {...defaultProps} selectedOverlays={["normal"]} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("calls onToggleOverlay with overlay id when clicked", () => {
    const onToggleOverlay = vi.fn();
    render(
      <OverlaySelector {...defaultProps} onToggleOverlay={onToggleOverlay} />,
    );

    fireEvent.click(screen.getByText("Normal"));

    expect(onToggleOverlay).toHaveBeenCalledWith("normal");
  });

  it("calls onToggleOverlay to uncheck a selected overlay", () => {
    const onToggleOverlay = vi.fn();
    render(
      <OverlaySelector
        selectedOverlays={["normal"]}
        onToggleOverlay={onToggleOverlay}
      />,
    );

    fireEvent.click(screen.getByText("Normal"));

    expect(onToggleOverlay).toHaveBeenCalledWith("normal");
  });
});
