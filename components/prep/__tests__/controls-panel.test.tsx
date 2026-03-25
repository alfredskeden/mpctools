import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "../controls-panel";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const defaultProps = {
  scale: 1,
  selectedOverlays: [] as string[],
  rotation: 0,
  onUpdateScale: vi.fn(),
  onToggleOverlay: vi.fn(),
  onUpdateRotation: vi.fn(),
};

describe("ControlsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders controls group", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByRole("group", { name: "Controls" })).toBeDefined();
  });

  it("shows scale percentage computed from scale prop", () => {
    render(<ControlsPanel {...defaultProps} scale={1.5} />);

    expect(screen.getByText("150%")).toBeDefined();
  });

  it("calls onUpdateScale with decreased value when minus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Decrease scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.99);
  });

  it("calls onUpdateScale with increased value when plus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Increase scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(1.01);
  });

  it("disables decrease button at minimum scale", () => {
    render(<ControlsPanel {...defaultProps} scale={0.5} />);

    const btn = screen.getByRole("button", { name: "Decrease scale" });
    expect(btn).toBeDisabled();
  });

  it("does not disable increase button at high scale", () => {
    render(<ControlsPanel {...defaultProps} scale={3} />);

    const btn = screen.getByRole("button", { name: "Increase scale" });
    expect(btn).not.toBeDisabled();
  });

  it("clamps scale down to minimum", () => {
    const onUpdateScale = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        scale={0.505}
        onUpdateScale={onUpdateScale}
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Decrease scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.5);
  });

  it("increments scale without upper cap", () => {
    const onUpdateScale = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        scale={2.995}
        onUpdateScale={onUpdateScale}
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Increase scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(3.01);
  });

  it("renders overlay option checkboxes", () => {
    render(<ControlsPanel {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(OVERLAY_OPTIONS.length);
  });

  it("calls onToggleOverlay with option id when overlay is clicked", () => {
    const onToggleOverlay = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onToggleOverlay={onToggleOverlay} />,
    );

    fireEvent.click(screen.getByText(OVERLAY_OPTIONS[0].label));
    expect(onToggleOverlay).toHaveBeenCalledWith(OVERLAY_OPTIONS[0].id);
  });

  it("checks checkboxes for selected overlays", () => {
    render(
      <ControlsPanel
        {...defaultProps}
        selectedOverlays={["normal", "short"]}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    const normalCheckbox = checkboxes[0];
    const mediumCheckbox = checkboxes[1];
    const shortCheckbox = checkboxes[2];

    expect(normalCheckbox).toBeChecked();
    expect(mediumCheckbox).not.toBeChecked();
    expect(shortCheckbox).toBeChecked();
  });

  it("marks selected overlay checkbox as checked", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={["normal"]} />);

    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  });

  it("marks unselected overlay checkbox as unchecked", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={[]} />);

    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();
  });

  it("shows rotation value computed from rotation prop", () => {
    render(<ControlsPanel {...defaultProps} rotation={45} />);

    expect(screen.getByText("45°")).toBeDefined();
  });

  it("calls onUpdateRotation when rotation slider changes", () => {
    const onUpdateRotation = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onUpdateRotation={onUpdateRotation} />,
    );

    const slider = screen.getByRole("slider", { name: "Rotation" });
    fireEvent.change(slider, { target: { value: "90" } });

    expect(onUpdateRotation).toHaveBeenCalledWith(90);
  });

  it("renders rotation slider with correct range", () => {
    render(<ControlsPanel {...defaultProps} />);

    const slider = screen.getByRole("slider", { name: "Rotation" });
    expect(slider.getAttribute("min")).toBe("-180");
    expect(slider.getAttribute("max")).toBe("180");
  });
});
