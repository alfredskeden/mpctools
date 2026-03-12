import { render, screen, fireEvent } from "@testing-library/react";
import { OverlaySelector } from "./overlay-selector";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const defaultProps = {
  selectedOverlay: null as string | null,
  onSelectOverlay: vi.fn(),
};

describe("OverlaySelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a None button and all overlay options", () => {
    render(<OverlaySelector {...defaultProps} />);

    expect(screen.getByText("None")).toBeDefined();
    for (const option of OVERLAY_OPTIONS) {
      expect(screen.getByText(option.label)).toBeDefined();
    }
  });

  it("renders with group role", () => {
    render(<OverlaySelector {...defaultProps} />);

    expect(screen.getByRole("group", { name: "Overlay options" })).toBeDefined();
  });

  it("highlights None when no overlay is selected", () => {
    render(<OverlaySelector {...defaultProps} selectedOverlay={null} />);

    const noneBtn = screen.getByText("None");
    expect(noneBtn.className).toContain("bg-primary");
  });

  it("highlights selected overlay button", () => {
    render(<OverlaySelector {...defaultProps} selectedOverlay="normal" />);

    const normalBtn = screen.getByText("Normal");
    expect(normalBtn.className).toContain("bg-primary");

    const noneBtn = screen.getByText("None");
    expect(noneBtn.className).toContain("bg-background");
  });

  it("calls onSelectOverlay with overlay id when clicked", () => {
    const onSelectOverlay = vi.fn();
    render(<OverlaySelector {...defaultProps} onSelectOverlay={onSelectOverlay} />);

    fireEvent.click(screen.getByText("Normal"));

    expect(onSelectOverlay).toHaveBeenCalledWith("normal");
  });

  it("calls onSelectOverlay with null when None is clicked", () => {
    const onSelectOverlay = vi.fn();
    render(
      <OverlaySelector
        selectedOverlay="normal"
        onSelectOverlay={onSelectOverlay}
      />,
    );

    fireEvent.click(screen.getByText("None"));

    expect(onSelectOverlay).toHaveBeenCalledWith(null);
  });
});
