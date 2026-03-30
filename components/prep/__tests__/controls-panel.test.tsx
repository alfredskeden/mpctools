import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "../controls-panel";
import {
  OVERLAY_OPTIONS,
  CANVAS_SIZE_PRESETS,
} from "@/hooks/use-prep-workflow";

const [DEFAULT_PRESET, CLASSIC_PRESET] = CANVAS_SIZE_PRESETS;

const defaultProps = {
  scale: 1,
  selectedOverlays: [] as string[],
  canvasWidth: DEFAULT_PRESET.width,
  canvasHeight: DEFAULT_PRESET.height,
  onUpdateScale: vi.fn(),
  onToggleOverlay: vi.fn(),
  onSetCanvasSize: vi.fn(),
  onCenterHorizontal: vi.fn(),
  onSetVerticalPreset: vi.fn(),
};

describe("ControlsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders controls group", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(screen.getByRole("group", { name: "Controls" })).toBeDefined();
  });

  it("shows scale percentage computed from scale prop", () => {
    render(<ControlsPanel {...defaultProps} scale={1.5} />);

    expect(screen.getByText("150%")).toBeDefined();
  });

  it("calls onUpdateScale with decreased value when minus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Decrease scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.99);
  });

  it("calls onUpdateScale with increased value when plus is clicked", () => {
    const onUpdateScale = vi.fn();
    render(<ControlsPanel {...defaultProps} onUpdateScale={onUpdateScale} />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Increase scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(1.01);
  });

  it("disables decrease button at minimum scale", () => {
    render(<ControlsPanel {...defaultProps} scale={0.5} />);

    const btn = screen.getByRole("button", { name: "Decrease scale" });
    expect(btn).toBeDisabled();
  });

  it("does not disable increase button at high scale", () => {
    render(<ControlsPanel {...defaultProps} scale={3} />);

    const btn = screen.getByRole("button", { name: "Increase scale" });
    expect(btn).not.toBeDisabled();
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

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Decrease scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Decrease scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(0.5);
  });

  it("increments scale without upper cap", () => {
    const onUpdateScale = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        scale={2.995}
        onUpdateScale={onUpdateScale}
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Increase scale" }),
    );
    fireEvent.pointerUp(screen.getByRole("button", { name: "Increase scale" }));

    expect(onUpdateScale).toHaveBeenCalledWith(3.01);
  });

  it("renders overlay option checkboxes", () => {
    render(<ControlsPanel {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(OVERLAY_OPTIONS.length);
  });

  it("calls onToggleOverlay with option id when overlay checkbox is clicked", () => {
    const onToggleOverlay = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onToggleOverlay={onToggleOverlay} />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onToggleOverlay).toHaveBeenCalledWith(OVERLAY_OPTIONS[0].id);
  });

  it("checks checkboxes for selected overlays", () => {
    render(
      <ControlsPanel
        {...defaultProps}
        selectedOverlays={["normal", "short"]}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    const normalCheckbox = checkboxes[0];
    const mediumCheckbox = checkboxes[1];
    const shortCheckbox = checkboxes[2];

    expect(normalCheckbox).toBeChecked();
    expect(mediumCheckbox).not.toBeChecked();
    expect(shortCheckbox).toBeChecked();
  });

  it("marks selected overlay checkbox as checked", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={["normal"]} />);

    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  });

  it("marks unselected overlay checkbox as unchecked", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={[]} />);

    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();
  });

  it("calls onCenterHorizontal when Center H button is clicked", () => {
    const onCenterHorizontal = vi.fn();
    render(
      <ControlsPanel {...defaultProps} onCenterHorizontal={onCenterHorizontal} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Center horizontally" }));

    expect(onCenterHorizontal).toHaveBeenCalledOnce();
  });

  it("does not show vertical preset button when no preset-mapped overlay is selected", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={["black_bottom"]} />);

    expect(
      screen.queryByRole("button", { name: "Apply vertical preset" }),
    ).toBeNull();
  });

  it("does not show vertical preset button when no overlays are selected", () => {
    render(<ControlsPanel {...defaultProps} selectedOverlays={[]} />);

    expect(
      screen.queryByRole("button", { name: "Apply vertical preset" }),
    ).toBeNull();
  });

  it.each([
    { overlay: "normal", preset: "normal" },
    { overlay: "medium", preset: "medium" },
    { overlay: "short", preset: "short" },
    { overlay: "tall_normal", preset: "tall" },
  ])(
    "calls onSetVerticalPreset with '$preset' when $overlay overlay is selected",
    ({ overlay, preset }) => {
      const onSetVerticalPreset = vi.fn();
      render(
        <ControlsPanel
          {...defaultProps}
          selectedOverlays={[overlay]}
          onSetVerticalPreset={onSetVerticalPreset}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Apply vertical preset" }));

      expect(onSetVerticalPreset).toHaveBeenCalledWith(preset);
    },
  );

  it("uses the last selected overlay's preset when multiple are selected", () => {
    const onSetVerticalPreset = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        selectedOverlays={["short", "tall_normal", "normal"]}
        onSetVerticalPreset={onSetVerticalPreset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply vertical preset" }));

    expect(onSetVerticalPreset).toHaveBeenCalledWith("normal");
  });

  it("renders Default and Classic borderless canvas preset buttons", () => {
    render(<ControlsPanel {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Set canvas to Default" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Set canvas to Classic borderless" }),
    ).toBeDefined();
  });

  it("marks Default preset button as pressed when canvas matches Default dimensions", () => {
    render(
      <ControlsPanel
        {...defaultProps}
        canvasWidth={DEFAULT_PRESET.width}
        canvasHeight={DEFAULT_PRESET.height}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Set canvas to Default" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Set canvas to Classic borderless" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks Classic borderless preset button as pressed when canvas matches its dimensions", () => {
    render(
      <ControlsPanel
        {...defaultProps}
        canvasWidth={CLASSIC_PRESET.width}
        canvasHeight={CLASSIC_PRESET.height}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Set canvas to Classic borderless" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Set canvas to Default" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("neither preset is pressed when canvas size does not match either preset", () => {
    render(
      <ControlsPanel
        {...defaultProps}
        canvasWidth={2048}
        canvasHeight={2048}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Set canvas to Default" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Set canvas to Classic borderless" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSetCanvasSize with Default dimensions when Default button is clicked", () => {
    const onSetCanvasSize = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        canvasWidth={CLASSIC_PRESET.width}
        canvasHeight={CLASSIC_PRESET.height}
        onSetCanvasSize={onSetCanvasSize}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set canvas to Default" }));

    expect(onSetCanvasSize).toHaveBeenCalledWith(
      DEFAULT_PRESET.width,
      DEFAULT_PRESET.height,
    );
  });

  it("calls onSetCanvasSize with Classic borderless dimensions when Classic borderless button is clicked", () => {
    const onSetCanvasSize = vi.fn();
    render(
      <ControlsPanel
        {...defaultProps}
        onSetCanvasSize={onSetCanvasSize}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Set canvas to Classic borderless" }),
    );

    expect(onSetCanvasSize).toHaveBeenCalledWith(
      CLASSIC_PRESET.width,
      CLASSIC_PRESET.height,
    );
  });
});
