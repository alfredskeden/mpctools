import { render, screen, fireEvent } from "@testing-library/react";
import { MergerActions } from "../merger-actions";

const defaultProps = {
  canDownload: false,
  isDownloaded: false,
  featherStrength: 40,
  irregMagnitude: 100,
  irregDensity: 100,
  irregRadius: 0,
  irregBlur: 12,
  onDownload: vi.fn(),
  onFeatherChange: vi.fn(),
  onIrregMagnitudeChange: vi.fn(),
  onIrregDensityChange: vi.fn(),
  onIrregRadiusChange: vi.fn(),
  onIrregBlurChange: vi.fn(),
  onReseed: vi.fn(),
};

describe("MergerActions", () => {
  it("shows disabled download button when cannot download", () => {
    render(<MergerActions {...defaultProps} />);

    const btn = screen.getByRole("button", { name: /download merged/i });
    expect(btn).toBeDisabled();
  });

  it("shows enabled download button when can download", () => {
    render(<MergerActions {...defaultProps} canDownload />);

    const btn = screen.getByRole("button", { name: /download merged/i });
    expect(btn).not.toBeDisabled();
  });

  it("calls onDownload when button clicked", () => {
    const onDownload = vi.fn();
    render(
      <MergerActions {...defaultProps} canDownload onDownload={onDownload} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /download merged/i }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("shows downloaded state", () => {
    render(<MergerActions {...defaultProps} isDownloaded />);

    expect(screen.getByText("Downloaded ✓")).toBeDefined();
  });

  it("shows advanced options when toggled", () => {
    render(<MergerActions {...defaultProps} />);

    expect(screen.queryByText("Feather Strength")).toBeNull();

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    expect(screen.getByText("Feather Strength")).toBeDefined();
    expect(screen.getByText("40px")).toBeDefined();
    expect(screen.getByText("Magnitude")).toBeDefined();
    expect(screen.getByText("100px")).toBeDefined();
    expect(screen.getByText("Density")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByText("Irreg Radius")).toBeDefined();
    expect(screen.getByText("0px")).toBeDefined();
    expect(screen.getByText("Edge Blur")).toBeDefined();
    expect(screen.getByText("12px")).toBeDefined();
    expect(screen.getByText("OG + Outpaint")).toBeDefined();
  });

  it("hides advanced options when toggled again", () => {
    render(<MergerActions {...defaultProps} />);

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));
    expect(screen.getByText("Feather Strength")).toBeDefined();

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));
    expect(screen.queryByText("Feather Strength")).toBeNull();
  });

  it("calls onFeatherChange when slider changes", () => {
    const onFeatherChange = vi.fn();
    render(
      <MergerActions {...defaultProps} onFeatherChange={onFeatherChange} />,
    );

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    const slider = screen.getByLabelText("Feather Strength");
    fireEvent.change(slider, { target: { value: "80" } });

    expect(onFeatherChange).toHaveBeenCalledWith(80);
  });

  it("displays current feather value", () => {
    render(<MergerActions {...defaultProps} featherStrength={120} />);

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    expect(screen.getByText("120px")).toBeDefined();
  });

  it("calls onIrregMagnitudeChange when magnitude slider changes", () => {
    const onIrregMagnitudeChange = vi.fn();
    render(
      <MergerActions
        {...defaultProps}
        onIrregMagnitudeChange={onIrregMagnitudeChange}
      />,
    );

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    const slider = screen.getByLabelText("Magnitude");
    fireEvent.change(slider, { target: { value: "200" } });

    expect(onIrregMagnitudeChange).toHaveBeenCalledWith(200);
  });

  it("calls onIrregDensityChange when density slider changes", () => {
    const onIrregDensityChange = vi.fn();
    render(
      <MergerActions
        {...defaultProps}
        onIrregDensityChange={onIrregDensityChange}
      />,
    );

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    const slider = screen.getByLabelText("Density");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(onIrregDensityChange).toHaveBeenCalledWith(50);
  });

  it("calls onIrregRadiusChange when irreg radius slider changes", () => {
    const onIrregRadiusChange = vi.fn();
    render(
      <MergerActions
        {...defaultProps}
        onIrregRadiusChange={onIrregRadiusChange}
      />,
    );

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    const slider = screen.getByLabelText("Irreg Radius");
    fireEvent.change(slider, { target: { value: "250" } });

    expect(onIrregRadiusChange).toHaveBeenCalledWith(250);
  });

  it("calls onIrregBlurChange when edge blur slider changes", () => {
    const onIrregBlurChange = vi.fn();
    render(
      <MergerActions
        {...defaultProps}
        onIrregBlurChange={onIrregBlurChange}
      />,
    );

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    const slider = screen.getByLabelText("Edge Blur");
    fireEvent.change(slider, { target: { value: "30" } });

    expect(onIrregBlurChange).toHaveBeenCalledWith(30);
  });

  it("calls onReseed when reseed button clicked", () => {
    const onReseed = vi.fn();
    render(<MergerActions {...defaultProps} onReseed={onReseed} />);

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));
    fireEvent.click(screen.getByRole("button", { name: /reseed/i }));

    expect(onReseed).toHaveBeenCalledOnce();
  });
});
