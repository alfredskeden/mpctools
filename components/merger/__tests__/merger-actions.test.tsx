import { render, screen, fireEvent } from "@testing-library/react";
import { MergerActions } from "../merger-actions";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

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

  it("shows downloaded state as a disabled button", () => {
    render(<MergerActions {...defaultProps} isDownloaded />);

    const btn = screen.getByRole("button", { name: /downloaded/i });
    expect(btn.getAttribute("data-downloaded")).toBe("true");
    expect(btn).toBeDisabled();
  });

  it("shows advanced options panel when toggled", () => {
    render(<MergerActions {...defaultProps} />);

    expect(screen.queryByLabelText("Feather Strength")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    expect(screen.getByLabelText("Feather Strength")).toBeDefined();
    expect(screen.getByText("40px")).toBeDefined();
    expect(screen.getByLabelText("Magnitude")).toBeDefined();
    expect(screen.getByText("100px")).toBeDefined();
    expect(screen.getByLabelText("Density")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByLabelText("Irreg Radius")).toBeDefined();
    expect(screen.getByText("0px")).toBeDefined();
    expect(screen.getByLabelText("Edge Blur")).toBeDefined();
    expect(screen.getByText("12px")).toBeDefined();
  });

  it("hides advanced options when toggled again", () => {
    render(<MergerActions {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /advanced options/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText("Feather Strength")).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(screen.queryByLabelText("Feather Strength")).toBeNull();
  });

  it("calls onFeatherChange when slider changes", () => {
    const onFeatherChange = vi.fn();
    render(
      <MergerActions {...defaultProps} onFeatherChange={onFeatherChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Feather Strength");
    fireEvent.change(slider, { target: { value: "80" } });

    expect(onFeatherChange).toHaveBeenCalledWith(80);
  });

  it("displays current feather value", () => {
    render(<MergerActions {...defaultProps} featherStrength={120} />);

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Edge Blur");
    fireEvent.change(slider, { target: { value: "30" } });

    expect(onIrregBlurChange).toHaveBeenCalledWith(30);
  });

  it("calls onReseed when reseed button clicked", () => {
    const onReseed = vi.fn();
    render(<MergerActions {...defaultProps} onReseed={onReseed} />);

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));
    fireEvent.click(screen.getByRole("button", { name: /reseed/i }));

    expect(onReseed).toHaveBeenCalledOnce();
  });

  it("tracks feather adjustment on pointer up", () => {
    render(<MergerActions {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Feather Strength");
    fireEvent.pointerUp(slider, { target: { value: "80" } });

    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "feather", value: expect.any(Number) });
  });

  it("tracks magnitude adjustment on pointer up", () => {
    render(<MergerActions {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Magnitude");
    fireEvent.pointerUp(slider, { target: { value: "200" } });

    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_magnitude", value: expect.any(Number) });
  });

  it("tracks density adjustment on pointer up", () => {
    render(<MergerActions {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Density");
    fireEvent.pointerUp(slider, { target: { value: "50" } });

    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_density", value: expect.any(Number) });
  });

  it("tracks radius adjustment on pointer up", () => {
    render(<MergerActions {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Irreg Radius");
    fireEvent.pointerUp(slider, { target: { value: "250" } });

    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_radius", value: expect.any(Number) });
  });

  it("tracks blur adjustment on pointer up", () => {
    render(<MergerActions {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    const slider = screen.getByLabelText("Edge Blur");
    fireEvent.pointerUp(slider, { target: { value: "30" } });

    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_blur", value: expect.any(Number) });
  });
});
