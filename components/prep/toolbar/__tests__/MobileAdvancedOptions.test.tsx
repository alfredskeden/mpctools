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
  it("renders the Advanced options toggle button", () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /advanced options/i }),
    ).toBeDefined();
  });

  it("does not show sections when collapsed", () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    expect(
      screen.queryByTestId("mobile-advanced-sections"),
    ).not.toBeInTheDocument();
  });

  it("shows sections when expanded", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    expect(screen.getByTestId("mobile-advanced-sections")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /image controls/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /overlay guides/i }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /canvas size/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /dpi override/i })).toBeDefined();
  });

  it("collapses when Advanced options is clicked again", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    const toggleBtn = screen.getByRole("button", { name: /advanced options/i });
    await userEvent.click(toggleBtn);
    expect(screen.getByTestId("mobile-advanced-sections")).toBeInTheDocument();

    await userEvent.click(toggleBtn);
    expect(
      screen.queryByTestId("mobile-advanced-sections"),
    ).not.toBeInTheDocument();
  });

  it("sets aria-expanded on main toggle", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    const button = screen.getByRole("button", { name: /advanced options/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("expands Image Controls section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /image controls/i }));

    expect(screen.getByLabelText("Position X")).toBeInTheDocument();
  });

  it("expands Overlay Guides section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /overlay guides/i }),
    );

    // Overlay guides panel renders checkboxes
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("expands Canvas Size section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /canvas size/i }));

    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
  });

  it("expands DPI Override section when clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /dpi override/i }));

    expect(screen.getByLabelText("DPI value")).toBeInTheDocument();
  });

  it("collapses a section when its title is clicked again", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    const imageBtn = screen.getByRole("button", { name: /image controls/i });
    await userEvent.click(imageBtn);
    expect(screen.getByLabelText("Position X")).toBeInTheDocument();

    await userEvent.click(imageBtn);
    expect(screen.queryByLabelText("Position X")).not.toBeInTheDocument();
  });

  it("switches sections when a different one is clicked", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /image controls/i }),
    );
    expect(screen.getByLabelText("Position X")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /canvas size/i }));
    expect(screen.queryByLabelText("Position X")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
  });

  it("sets aria-expanded on section buttons", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );

    const imageButton = screen.getByRole("button", { name: /image controls/i });
    expect(imageButton).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(imageButton);
    expect(imageButton).toHaveAttribute("aria-expanded", "true");
  });

  it("marks expanded section button as aria-expanded true", async () => {
    render(<MobileAdvancedOptions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /advanced options/i }),
    );
    const imageButton = screen.getByRole("button", { name: /image controls/i });
    await userEvent.click(imageButton);

    expect(imageButton).toHaveAttribute("aria-expanded", "true");
  });

  it("applies rotate-180 to chevron when expanded", async () => {
    const { container } = render(<MobileAdvancedOptions {...defaultProps} />);
    const button = screen.getByRole("button", { name: /advanced options/i });

    // Before click, aria-expanded is false
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);

    // After click, aria-expanded is true and chevron is rotated
    const updatedChevron = container.querySelector(
      "button[aria-expanded='true'] svg",
    );
    expect(updatedChevron?.classList.contains("rotate-180")).toBe(true);
  });
});
