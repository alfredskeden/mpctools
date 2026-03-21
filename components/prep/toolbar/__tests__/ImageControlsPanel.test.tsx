import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageControlsPanel } from "../panels/ImageControlsPanel";
import type { PrepState } from "@/hooks/use-prep-workflow";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const makeState = (overrides: Partial<PrepState> = {}): PrepState => ({
  currentStep: 2,
  uploadedImage: "data:test",
  imageElement: { width: 200, height: 300 } as HTMLImageElement,
  fileName: "test.png",
  position: { x: 50, y: 100 },
  scale: 1.5,
  rotation: 45,
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
  ...overrides,
});

const noop = () => {};

const defaultProps = {
  state: makeState(),
  onUpdatePosition: noop,
  onUpdateScale: noop,
  onUpdateRotation: noop,
  onSetKeepAspectRatio: noop,
  onSetAlgorithm: noop,
  onSetImageDimensions: noop,
  onCenterHorizontal: noop,
  onCenterVertical: noop,
  onFitWidth: noop,
  onFitHeight: noop,
  onSetVerticalPreset: noop,
};

describe("ImageControlsPanel", () => {
  it("renders position inputs with current values", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByLabelText("Position X")).toHaveValue(50);
    expect(screen.getByLabelText("Position Y")).toHaveValue(100);
  });

  it("renders size inputs computed from image dimensions and scale", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    // 200 * 1.5 = 300, 300 * 1.5 = 450
    expect(screen.getByLabelText("Width")).toHaveValue(300);
    expect(screen.getByLabelText("Height")).toHaveValue(450);
  });

  it("renders 0 for width and height when no image element", () => {
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ imageElement: null })}
      />,
    );
    expect(screen.getByLabelText("Width")).toHaveValue(0);
    expect(screen.getByLabelText("Height")).toHaveValue(0);
  });

  it("calls onUpdatePosition when X input changes", () => {
    const onUpdatePosition = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onUpdatePosition={onUpdatePosition}
      />,
    );
    fireEvent.change(screen.getByLabelText("Position X"), {
      target: { value: "75" },
    });
    expect(onUpdatePosition).toHaveBeenCalledWith(75, 100);
  });

  it("calls onUpdatePosition when Y input changes", () => {
    const onUpdatePosition = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onUpdatePosition={onUpdatePosition}
      />,
    );
    fireEvent.change(screen.getByLabelText("Position Y"), {
      target: { value: "200" },
    });
    expect(onUpdatePosition).toHaveBeenCalledWith(50, 200);
  });

  it("calls onSetImageDimensions when width changes", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "400" },
    });
    expect(onSetImageDimensions).toHaveBeenCalled();
  });

  it("renders keep aspect ratio checkbox checked by default", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByLabelText("Keep aspect ratio")).toBeChecked();
  });

  it("calls onSetKeepAspectRatio when toggled", async () => {
    const onSetKeepAspectRatio = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onSetKeepAspectRatio={onSetKeepAspectRatio}
      />,
    );
    await userEvent.click(screen.getByLabelText("Keep aspect ratio"));
    expect(onSetKeepAspectRatio).toHaveBeenCalledWith(false);
  });

  it("calls onCenterHorizontal when Center H is clicked", async () => {
    const onCenterHorizontal = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onCenterHorizontal={onCenterHorizontal}
      />,
    );
    await userEvent.click(screen.getByText("Center H"));
    expect(onCenterHorizontal).toHaveBeenCalledTimes(1);
  });

  it("calls onCenterVertical when Center V is clicked", async () => {
    const onCenterVertical = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onCenterVertical={onCenterVertical}
      />,
    );
    await userEvent.click(screen.getByText("Center V"));
    expect(onCenterVertical).toHaveBeenCalledTimes(1);
  });

  it("calls onFitWidth when Fit W is clicked", async () => {
    const onFitWidth = vi.fn();
    render(
      <ImageControlsPanel {...defaultProps} onFitWidth={onFitWidth} />,
    );
    await userEvent.click(screen.getByText("Fit W"));
    expect(onFitWidth).toHaveBeenCalledTimes(1);
  });

  it("calls onFitHeight when Fit H is clicked", async () => {
    const onFitHeight = vi.fn();
    render(
      <ImageControlsPanel {...defaultProps} onFitHeight={onFitHeight} />,
    );
    await userEvent.click(screen.getByText("Fit H"));
    expect(onFitHeight).toHaveBeenCalledTimes(1);
  });

  it("renders vertical preset buttons", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Tall")).toBeInTheDocument();
  });

  it("calls onSetVerticalPreset when a preset is clicked", async () => {
    const onSetVerticalPreset = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onSetVerticalPreset={onSetVerticalPreset}
      />,
    );
    await userEvent.click(screen.getByText("Short"));
    expect(onSetVerticalPreset).toHaveBeenCalledWith("short");
  });

  it("renders algorithm dropdown with current value", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByLabelText("Algorithm")).toHaveValue("detail-preserving");
  });

  it("calls onSetAlgorithm when algorithm changes", async () => {
    const onSetAlgorithm = vi.fn();
    render(
      <ImageControlsPanel {...defaultProps} onSetAlgorithm={onSetAlgorithm} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Algorithm"), "standard");
    expect(onSetAlgorithm).toHaveBeenCalledWith("standard");
  });

  it("renders rotation slider with current value", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByLabelText("Rotation")).toHaveValue("45");
    expect(screen.getByText("45°")).toBeInTheDocument();
  });

  it("renders scale percentage", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });

  it("renders scale percentage for scale 1.0", () => {
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ scale: 1 })}
      />,
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders scale down and scale up buttons", () => {
    render(<ImageControlsPanel {...defaultProps} />);
    expect(screen.getByLabelText("Scale down")).toBeInTheDocument();
    expect(screen.getByLabelText("Scale up")).toBeInTheDocument();
  });

  it("calls onUpdateScale when scale down is clicked", async () => {
    const onUpdateScale = vi.fn();
    render(
      <ImageControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />,
    );
    await userEvent.click(screen.getByLabelText("Scale down"));
    expect(onUpdateScale).toHaveBeenCalledWith(1.49);
  });

  it("calls onUpdateScale when scale up is clicked", async () => {
    const onUpdateScale = vi.fn();
    render(
      <ImageControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />,
    );
    await userEvent.click(screen.getByLabelText("Scale up"));
    expect(onUpdateScale).toHaveBeenCalledWith(1.51);
  });

  it("calls onUpdateRotation when rotation slider changes", () => {
    const onUpdateRotation = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        onUpdateRotation={onUpdateRotation}
      />,
    );
    fireEvent.change(screen.getByLabelText("Rotation"), {
      target: { value: "90" },
    });
    expect(onUpdateRotation).toHaveBeenCalledWith(90);
  });

  it("calls onSetImageDimensions with aspect-corrected values when keepAspectRatio is on and height changes", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ keepAspectRatio: true })}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Height"), {
      target: { value: "600" },
    });
    // image is 200x300, so width = round(600 * 200/300) = 400
    expect(onSetImageDimensions).toHaveBeenCalledWith(400, 600);
  });

  it("does not call onSetImageDimensions for width change with no image", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ imageElement: null })}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "400" },
    });
    expect(onSetImageDimensions).not.toHaveBeenCalled();
  });

  it("does not call onSetImageDimensions for height change with no image", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ imageElement: null })}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Height"), {
      target: { value: "400" },
    });
    expect(onSetImageDimensions).not.toHaveBeenCalled();
  });

  it("calls onSetImageDimensions with W/H when keepAspectRatio is off and width changes", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ keepAspectRatio: false })}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "400" },
    });
    expect(onSetImageDimensions).toHaveBeenCalledWith(400, 450);
  });

  it("calls onSetImageDimensions with W/H when keepAspectRatio is off and height changes", () => {
    const onSetImageDimensions = vi.fn();
    render(
      <ImageControlsPanel
        {...defaultProps}
        state={makeState({ keepAspectRatio: false })}
        onSetImageDimensions={onSetImageDimensions}
      />,
    );
    fireEvent.change(screen.getByLabelText("Height"), {
      target: { value: "600" },
    });
    expect(onSetImageDimensions).toHaveBeenCalledWith(300, 600);
  });
});
