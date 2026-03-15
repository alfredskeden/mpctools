import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "../controls-panel";

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

  it("shows scale percentage", () => {
    render(<ControlsPanel {...defaultProps} scale={1.5} />);

    expect(screen.getByText("150%")).toBeDefined();
  });

  it("shows Scale label", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("Scale")).toBeDefined();
  });

  it("calls onUpdateScale with decreased value when minus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.99);
  });

  it("calls onUpdateScale with increased value when plus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.click(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(1.01);
  });

  it("disables decrease button at minimum scale", () => {
    render(<ControlsPanel {...defaultProps} scale={0.5} />);

    const btn = screen.getByRole("button", { name: "Decrease scale" });
    expect(btn).toBeDisabled();
  });

  it("disables increase button at maximum scale", () => {
    render(<ControlsPanel {...defaultProps} scale={3} />);

    const btn = screen.getByRole("button", { name: "Increase scale" });
    expect(btn).toBeDisabled();
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

    fireEvent.click(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.5);
  });

  it("clamps scale up to maximum", () => {
    const onUpdateScale = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        scale={2.995}
        onUpdateScale={onUpdateScale}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(3);
  });

  it("renders Frame Overlay section", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("Frame Overlay")).toBeDefined();
  });

  it("renders overlay option checkboxes", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("Normal")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Short")).toBeDefined();
    expect(screen.getByText("Tall Normal")).toBeDefined();
    expect(screen.getByText("Black Bottom")).toBeDefined();
  });

  it("calls onToggleOverlay with option id when checkbox is clicked", () => {
    const onToggleOverlay = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onToggleOverlay={onToggleOverlay} />,
    );

    fireEvent.click(screen.getByText("Normal"));
    expect(onToggleOverlay).toHaveBeenCalledWith("normal");
  });

  it("checks checkboxes for selected overlays", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={["normal", "short"]} />);

    const checkboxes = screen.getAllByRole("checkbox");
    const normalCheckbox = checkboxes[0];
    const mediumCheckbox = checkboxes[1];
    const shortCheckbox = checkboxes[2];

    expect(normalCheckbox).toBeChecked();
    expect(mediumCheckbox).not.toBeChecked();
    expect(shortCheckbox).toBeChecked();
  });

  it("highlights selected overlay text", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={["normal"]} />);

    const normalText = screen.getByText("Normal");
    expect(normalText.className).toContain("text-accent-blue");
  });

  it("does not highlight unselected overlay text", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={[]} />);

    const normalText = screen.getByText("Normal");
    expect(normalText.className).not.toContain("text-accent-blue");
  });

  it("shows rotation label and value", () => {
    render(<ControlsPanel {...defaultProps} rotation={45} />);

    expect(screen.getByText("Rotation")).toBeDefined();
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
