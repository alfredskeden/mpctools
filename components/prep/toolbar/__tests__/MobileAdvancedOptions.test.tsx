import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileAdvancedOptions } from "../MobileAdvancedOptions";
import type { PrepState } from "@/hooks/use-prep-workflow";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const noop = () => {};

const defaultState: PrepState = {
  currentStep: 2,
  uploadedImage: "data:test",
  imageElement: { width: 200, height: 300 } as HTMLImageElement,
  fileName: "test.png",
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  isPositioned: false,
  isDownloaded: false,
  selectedOverlays: [],
  canvasDataUrl: null,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  dpiOverride: null,
  overlayOpacities: {},
  keepAspectRatio: true,
  algorithm: "detail-preserving",
  overlayNativeDimensions: null,
};

const defaultProps = {
  state: defaultState,
  onUpdatePosition: noop,
  onUpdateScale: noop,
  onUpdateRotation: noop,
  onToggleOverlay: noop,
  onSetOverlayOpacity: noop,
  onSetCanvasSize: noop,
  onSetDpiOverride: noop,
  onSetKeepAspectRatio: noop,
  onSetAlgorithm: noop,
  onSetImageDimensions: noop,
  onCenterHorizontal: noop,
  onCenterVertical: noop,
  onFitWidth: noop,
  onFitHeight: noop,
  onSetVerticalPreset: noop,
};

describe("MobileAdvancedOptions", () => {
  it("renders the Advanced options button", () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    expect(screen.getByText("Advanced options")).toBeInTheDocument();
  });

  it("does not show sections when collapsed", () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    expect(
      screen.queryByTestId("mobile-advanced-sections"),
    ).not.toBeInTheDocument();
  });

  it("shows sections when expanded", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    expect(screen.getByTestId("mobile-advanced-sections")).toBeInTheDocument();
    expect(screen.getByText("Image Controls")).toBeInTheDocument();
    expect(screen.getByText("Overlay Guides")).toBeInTheDocument();
    expect(screen.getByText("Canvas Size")).toBeInTheDocument();
    expect(screen.getByText("DPI Override")).toBeInTheDocument();
  });

  it("collapses when Advanced options is clicked again", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    expect(screen.getByTestId("mobile-advanced-sections")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Advanced options"));
    expect(
      screen.queryByTestId("mobile-advanced-sections"),
    ).not.toBeInTheDocument();
  });

  it("sets aria-expanded on main toggle", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    const button = screen.getByText("Advanced options");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("expands Image Controls section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Image Controls"));

    expect(screen.getByLabelText("Position X")).toBeInTheDocument();
  });

  it("expands Overlay Guides section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Overlay Guides"));

    expect(
      screen.getByText(
        "Overlays are visual-only and will not be included in downloads.",
      ),
    ).toBeInTheDocument();
  });

  it("expands Canvas Size section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Canvas Size"));

    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
  });

  it("expands DPI Override section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("DPI Override"));

    expect(screen.getByLabelText("DPI value")).toBeInTheDocument();
  });

  it("collapses a section when its title is clicked again", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Image Controls"));
    expect(screen.getByLabelText("Position X")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Image Controls"));
    expect(screen.queryByLabelText("Position X")).not.toBeInTheDocument();
  });

  it("switches sections when a different one is clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Image Controls"));
    expect(screen.getByLabelText("Position X")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Canvas Size"));
    expect(screen.queryByLabelText("Position X")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
  });

  it("sets aria-expanded on section buttons", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));

    const imageButton = screen.getByText("Image Controls");
    expect(imageButton).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(imageButton);
    expect(imageButton).toHaveAttribute("aria-expanded", "true");
  });

  it("applies active styling to expanded section", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced options"));
    await userEvent.click(screen.getByText("Image Controls"));

    const button = screen.getByText("Image Controls");
    expect(button.className).toContain("bg-surface-overlay");
  });

  it("applies rotate-180 to chevron when expanded", async () => {
    const { container } = render(<MobileAdvancedOptions {...defaultProps} />);
    const button = screen.getByText("Advanced options");

    // Before click, chevron should not have rotate-180
    const chevron = button.querySelector("svg");
    expect(chevron?.classList.contains("rotate-180")).toBe(false);

    await userEvent.click(button);

    // After click, chevron should have rotate-180
    const updatedChevron = container.querySelector(
      "button[aria-expanded='true'] svg",
    );
    expect(updatedChevron?.classList.contains("rotate-180")).toBe(true);
  });
});
