import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "../controls-panel";

const defaultProps = {
  scale: 1,
  selectedOverlay: null as string | null,
  rotation: 0,
  onUpdateScale: vi.fn(),
  onSelectOverlay: vi.fn(),
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

  it("calls onUpdateScale when slider changes", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    const slider = screen.getByRole("slider", { name: "Scale" });
    fireEvent.change(slider, { target: { value: "150" } });

    expect(onUpdateScale).toHaveBeenCalledWith(1.5);
  });

  it("renders Frame Overlay section", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("Frame Overlay")).toBeDefined();
  });

  it("renders None button for overlay", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("None")).toBeDefined();
  });

  it("renders overlay option buttons", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByText("Normal")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Short")).toBeDefined();
    expect(screen.getByText("Tall Normal")).toBeDefined();
    expect(screen.getByText("Black Bottom")).toBeDefined();
  });

  it("calls onSelectOverlay with null when None is clicked", () => {
    const onSelectOverlay = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onSelectOverlay={onSelectOverlay} />,
    );

    fireEvent.click(screen.getByText("None"));
    expect(onSelectOverlay).toHaveBeenCalledWith(null);
  });

  it("calls onSelectOverlay with option id when overlay button is clicked", () => {
    const onSelectOverlay = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onSelectOverlay={onSelectOverlay} />,
    );

    fireEvent.click(screen.getByText("Normal"));
    expect(onSelectOverlay).toHaveBeenCalledWith("normal");
  });

  it("highlights selected overlay button", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlay="normal" />);

    const normalBtn = screen.getByText("Normal");
    expect(normalBtn.className).toContain("border-accent-blue");
    expect(normalBtn.className).toContain("text-accent-blue");
  });

  it("highlights None when no overlay is selected", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlay={null} />);

    const noneBtn = screen.getByText("None");
    expect(noneBtn.className).toContain("border-accent-blue");
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
