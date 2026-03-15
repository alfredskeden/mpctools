import { render, screen, fireEvent } from "@testing-library/react";
import { MergerActions } from "../merger-actions";

const defaultProps = {
  canDownload: false,
  isDownloaded: false,
  featherStrength: 40,
  onDownload: vi.fn(),
  onFeatherChange: vi.fn(),
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

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "80" } });

    expect(onFeatherChange).toHaveBeenCalledWith(80);
  });

  it("displays current feather value", () => {
    render(<MergerActions {...defaultProps} featherStrength={120} />);

    fireEvent.click(screen.getByText("ADVANCED OPTIONS"));

    expect(screen.getByText("120px")).toBeDefined();
  });
});
