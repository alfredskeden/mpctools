import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverlayGuidesPanel } from "../panels/OverlayGuidesPanel";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const noop = () => {};

const defaultProps = {
  selectedOverlays: ["normal"],
  overlayOpacities: { normal: 80 },
  onToggleOverlay: noop,
  onSetOverlayOpacity: noop,
};

describe("OverlayGuidesPanel", () => {
  it("renders description text", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    expect(
      screen.getByText(
        "Overlays are visual-only and will not be included in downloads.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a checkbox for each overlay option", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(OVERLAY_OPTIONS.length);
  });

  it("shows checked state for selected overlays", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    const normalCheckbox = screen.getByRole("checkbox", { name: /^Normal$/i });
    expect(normalCheckbox).toBeChecked();
  });

  it("shows unchecked state for unselected overlays", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    const mediumCheckbox = screen.getByRole("checkbox", { name: /^Medium$/i });
    expect(mediumCheckbox).not.toBeChecked();
  });

  it("calls onToggleOverlay when checkbox is clicked", async () => {
    const onToggleOverlay = vi.fn();
    render(
      <OverlayGuidesPanel
        {...defaultProps}
        onToggleOverlay={onToggleOverlay}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: /^Medium$/i }));
    expect(onToggleOverlay).toHaveBeenCalledWith("medium");
  });

  it("shows opacity slider for selected overlays", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    expect(screen.getByLabelText("Normal opacity")).toBeInTheDocument();
  });

  it("does not show opacity slider for unselected overlays", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    expect(screen.queryByLabelText("Medium opacity")).not.toBeInTheDocument();
  });

  it("shows opacity percentage", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("defaults to 100% for overlays without explicit opacity", () => {
    render(
      <OverlayGuidesPanel
        {...defaultProps}
        selectedOverlays={["short"]}
        overlayOpacities={{}}
      />,
    );
    const slider = screen.getByLabelText("Short opacity");
    expect(slider).toHaveValue("100");
  });

  it("renders opacity slider with correct value", () => {
    render(<OverlayGuidesPanel {...defaultProps} />);
    const slider = screen.getByLabelText("Normal opacity");
    expect(slider).toHaveValue("80");
  });

  it("calls onSetOverlayOpacity when slider changes", () => {
    const onSetOverlayOpacity = vi.fn();
    render(
      <OverlayGuidesPanel
        {...defaultProps}
        onSetOverlayOpacity={onSetOverlayOpacity}
      />,
    );
    const slider = screen.getByLabelText("Normal opacity");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(onSetOverlayOpacity).toHaveBeenCalledWith("normal", 50);
  });
});
