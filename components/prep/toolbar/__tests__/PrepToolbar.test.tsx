import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrepToolbar } from "../PrepToolbar";
import type { PrepState } from "@/hooks/use-prep-workflow";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const makeState = (overrides: Partial<PrepState> = {}): PrepState => ({
  currentStep: 2,
  uploadedImage: "data:test",
  imageElement: { width: 100, height: 100 } as HTMLImageElement,
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
  canvasSizingMode: "scale-image",
  canvasAspect: { w: 11, h: 15 },
  ...overrides,
});

const noop = () => {};

const defaultProps = {
  disabled: false,
  state: makeState(),
  onUpdatePosition: noop,
  onUpdateScale: noop,
  onUpdateRotation: noop,
  onToggleOverlay: noop,
  onSetOverlayOpacity: noop,
  onSetCanvasSize: noop,
  onSetCanvasSizingMode: noop,
  onSetCanvasSizeStep: noop,
  onSetNativeCanvasDimension: noop,
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

describe("PrepToolbar", () => {
  it("renders 4 icon buttons", () => {
    render(<PrepToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("renders buttons with correct labels", () => {
    render(<PrepToolbar {...defaultProps} />);
    expect(screen.getByLabelText("Image Controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Overlay Guides")).toBeInTheDocument();
    expect(screen.getByLabelText("Canvas Size")).toBeInTheDocument();
    expect(screen.getByLabelText("DPI Override")).toBeInTheDocument();
  });

  it("disables all buttons when disabled is true", () => {
    render(<PrepToolbar {...defaultProps} disabled={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("opens Image Controls panel when clicking Image Controls button", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("Image Controls"));
    expect(
      screen.getByText("Image Controls", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  it("opens Overlay Guides panel when clicking Overlay Guides button", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("Overlay Guides"));
    expect(
      screen.getByText("Overlay Guides", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  it("opens Canvas Size panel when clicking Canvas Size button", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("Canvas Size"));
    expect(
      screen.getByText("Canvas Size", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  it("opens DPI Override panel when clicking DPI Override button", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("DPI Override"));
    expect(
      screen.getByText("DPI Override", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  it("closes panel when clicking the same icon again", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("Image Controls"));
    expect(
      screen.getByText("Image Controls", { selector: "h3" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Image Controls"));
    expect(
      screen.queryByText("Image Controls", { selector: "h3" }),
    ).not.toBeInTheDocument();
  });

  it("switches panel when clicking a different icon", async () => {
    render(<PrepToolbar {...defaultProps} />);
    await userEvent.click(screen.getByLabelText("Image Controls"));
    expect(
      screen.getByText("Image Controls", { selector: "h3" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Canvas Size"));
    expect(
      screen.queryByText("Image Controls", { selector: "h3" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Canvas Size", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  it("closes panel on click outside", async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <PrepToolbar {...defaultProps} />
      </div>,
    );
    await userEvent.click(screen.getByLabelText("Image Controls"));
    expect(
      screen.getByText("Image Controls", { selector: "h3" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("outside"));
    expect(
      screen.queryByText("Image Controls", { selector: "h3" }),
    ).not.toBeInTheDocument();
  });
});

describe("PrepToolbar canvas sizing plumbing", () => {
  it("passes the sizing mode callbacks to the Canvas Size panel", async () => {
    // Given
    const onSetCanvasSizingMode = vi.fn();
    render(
      <PrepToolbar
        {...defaultProps}
        onSetCanvasSizingMode={onSetCanvasSizingMode}
      />,
    );

    // When
    await userEvent.click(screen.getByLabelText("Canvas Size"));
    const modes = within(
      screen.getByRole("group", { name: "Canvas sizing mode" }),
    ).getAllByRole("button");
    await userEvent.click(modes[1]);

    // Then
    expect(onSetCanvasSizingMode).toHaveBeenCalledWith("native-image");
  });

  it("passes the step callback to the Canvas Size panel", async () => {
    // Given
    const onSetCanvasSizeStep = vi.fn();
    render(
      <PrepToolbar
        {...defaultProps}
        state={makeState({ canvasSizingMode: "native-image" })}
        onSetCanvasSizeStep={onSetCanvasSizeStep}
      />,
    );

    // When
    await userEvent.click(screen.getByLabelText("Canvas Size"));
    fireEvent.change(screen.getByLabelText("Canvas size step"), {
      target: { value: "410" },
    });

    // Then
    expect(onSetCanvasSizeStep).toHaveBeenCalledWith(410);
  });

  it("disables the DPI panel while native-image sizing is active", async () => {
    // Given
    render(
      <PrepToolbar
        {...defaultProps}
        state={makeState({ canvasSizingMode: "native-image" })}
      />,
    );

    // When
    await userEvent.click(screen.getByLabelText("DPI Override"));

    // Then
    expect(screen.getByLabelText("DPI value")).toBeDisabled();
  });

  it("leaves the DPI panel enabled in the default mode", async () => {
    // Given
    render(<PrepToolbar {...defaultProps} />);

    // When
    await userEvent.click(screen.getByLabelText("DPI Override"));

    // Then
    expect(screen.getByLabelText("DPI value")).toBeEnabled();
  });
});
