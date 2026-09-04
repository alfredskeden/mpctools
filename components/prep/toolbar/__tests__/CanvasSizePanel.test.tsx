import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanvasSizePanel, computeAspectRatio } from "../panels/CanvasSizePanel";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  canvasStepBounds,
} from "@/lib/canvas-utils";
import type { CanvasSizingMode } from "@/hooks/use-prep-workflow";

const noop = () => {};

const defaultProps = {
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  canvasSizingMode: "scale-image" as CanvasSizingMode,
  canvasAspect: { w: 11, h: 15 },
  onSetCanvasSize: noop,
  onSetCanvasSizingMode: noop,
  onSetCanvasSizeStep: noop,
  onSetNativeCanvasDimension: noop,
};

const modeButtons = () =>
  within(
    screen.getByRole("group", { name: "Canvas sizing mode" }),
  ).getAllByRole("button");

describe("CanvasSizePanel", () => {
  it("renders width and height inputs with current values", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    expect(screen.getByLabelText("Canvas width")).toHaveValue(CANVAS_WIDTH);
    expect(screen.getByLabelText("Canvas height")).toHaveValue(CANVAS_HEIGHT);
  });

  it("shows computed aspect ratio", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    expect(screen.getByText(/Aspect ratio: 11:15/)).toBeInTheDocument();
  });

  it("calls onSetCanvasSize when width changes", () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    fireEvent.change(screen.getByLabelText("Canvas width"), {
      target: { value: "2048" },
    });
    expect(onSetCanvasSize).toHaveBeenCalledWith(2048, CANVAS_HEIGHT);
  });

  it("calls onSetCanvasSize when height changes", () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    fireEvent.change(screen.getByLabelText("Canvas height"), {
      target: { value: "2048" },
    });
    expect(onSetCanvasSize).toHaveBeenCalledWith(CANVAS_WIDTH, 2048);
  });

  it("renders named preset buttons", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(7); // 2 named + 5 ratio
  });

  it("calls onSetCanvasSize when a ratio preset is clicked", async () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /1:1/ }));
    expect(onSetCanvasSize).toHaveBeenCalledWith(2048, 2048);
  });

  it("marks the active preset with data-active true", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    const defaultButton = screen.getByRole("button", { name: /default/i });
    expect(defaultButton.getAttribute("data-active")).toBe("true");
  });

  it("marks inactive presets with data-active false", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    const classicButton = screen.getByRole("button", {
      name: /classic borderless/i,
    });
    expect(classicButton.getAttribute("data-active")).toBe("false");
  });

  it("marks active ratio preset with data-active true", () => {
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasWidth={2048}
        canvasHeight={2048}
      />,
    );
    const button1to1 = screen.getByRole("button", { name: /1:1/ });
    expect(button1to1.getAttribute("data-active")).toBe("true");
  });

  it("calls onSetCanvasSize when Classic borderless preset is clicked", async () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /classic borderless/i }),
    );
    expect(onSetCanvasSize).toHaveBeenCalledWith(3712, 4608);
  });
});

describe("computeAspectRatio", () => {
  it("computes 1:1 for equal values", () => {
    expect(computeAspectRatio(2048, 2048)).toBe("1:1");
  });

  it("computes 11:15 for 3520x4800", () => {
    expect(computeAspectRatio(3520, 4800)).toBe("11:15");
  });

  it("computes 4:3 for 3264x2448", () => {
    expect(computeAspectRatio(3264, 2448)).toBe("4:3");
  });
});

describe("CanvasSizePanel canvas sizing mode", () => {
  it("renders one toggle button per sizing mode", () => {
    // When
    render(<CanvasSizePanel {...defaultProps} />);

    // Then
    expect(modeButtons()).toHaveLength(2);
  });

  it("reflects the active mode through a state attribute", () => {
    // When
    render(
      <CanvasSizePanel {...defaultProps} canvasSizingMode="native-image" />,
    );

    // Then
    const [scaleMode, nativeMode] = modeButtons();
    expect(scaleMode.getAttribute("aria-pressed")).toBe("false");
    expect(scaleMode.getAttribute("data-active")).toBe("false");
    expect(nativeMode.getAttribute("aria-pressed")).toBe("true");
    expect(nativeMode.getAttribute("data-active")).toBe("true");
  });

  it("invokes the mode callback when a mode is picked", async () => {
    // Given
    const onSetCanvasSizingMode = vi.fn();
    render(
      <CanvasSizePanel
        {...defaultProps}
        onSetCanvasSizingMode={onSetCanvasSizingMode}
      />,
    );

    // When
    await userEvent.click(modeButtons()[1]);

    // Then
    expect(onSetCanvasSizingMode).toHaveBeenCalledWith("native-image");
  });

  it("renders the dimension inputs and presets without the step slider in the default mode", () => {
    // When
    render(<CanvasSizePanel {...defaultProps} />);

    // Then
    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
    expect(screen.getByLabelText("Canvas height")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /classic borderless/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Canvas size step")).toBeNull();
  });

  it("renders the step slider without dimension inputs or presets in the native mode", () => {
    // When
    render(
      <CanvasSizePanel {...defaultProps} canvasSizingMode="native-image" />,
    );

    // Then
    expect(screen.getByLabelText("Canvas size step")).toBeInTheDocument();
    expect(screen.getByLabelText("Canvas width")).toBeInTheDocument();
    expect(screen.getByLabelText("Canvas height")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /classic borderless/i }),
    ).toBeNull();
    expect(modeButtons()).toHaveLength(2);
  });

  it("takes the slider value from the current canvas width and bounds from the step limits", () => {
    // When
    render(
      <CanvasSizePanel {...defaultProps} canvasSizingMode="native-image" />,
    );

    // Then
    const slider = screen.getByLabelText("Canvas size step");
    const bounds = canvasStepBounds({ w: 11, h: 15 });
    expect(slider).toHaveValue("320");
    expect(slider.getAttribute("min")).toBe(String(bounds.min));
    expect(slider.getAttribute("max")).toBe(String(bounds.max));
  });

  it("invokes the step callback when the slider moves", () => {
    // Given
    const onSetCanvasSizeStep = vi.fn();
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        onSetCanvasSizeStep={onSetCanvasSizeStep}
      />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Canvas size step"), {
      target: { value: "450" },
    });

    // Then
    expect(onSetCanvasSizeStep).toHaveBeenCalledWith(450);
  });

  it("shows the current canvas dimensions in the native inputs", () => {
    // When
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        canvasWidth={2200}
        canvasHeight={3000}
      />,
    );

    // Then
    expect(screen.getByLabelText("Canvas width")).toHaveValue(2200);
    expect(screen.getByLabelText("Canvas height")).toHaveValue(3000);
  });

  it("invokes the dimension callback with a typed height", () => {
    // Given
    const onSetNativeCanvasDimension = vi.fn();
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        onSetNativeCanvasDimension={onSetNativeCanvasDimension}
      />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Canvas height"), {
      target: { value: "4600" },
    });

    // Then
    expect(onSetNativeCanvasDimension).toHaveBeenCalledWith("height", 4600);
  });

  it("invokes the dimension callback with a typed width", () => {
    // Given
    const onSetNativeCanvasDimension = vi.fn();
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        onSetNativeCanvasDimension={onSetNativeCanvasDimension}
      />,
    );

    // When
    fireEvent.change(screen.getByLabelText("Canvas width"), {
      target: { value: "2900" },
    });

    // Then
    expect(onSetNativeCanvasDimension).toHaveBeenCalledWith("width", 2900);
  });

  it("shows the locked ratio rather than one recomputed from an off-grid canvas", () => {
    // When
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        canvasAspect={{ w: 29, h: 36 }}
        canvasWidth={3706}
        canvasHeight={4600}
      />,
    );

    // Then
    expect(screen.getByTestId("canvas-aspect").textContent).toContain("29:36");
  });

  it("derives the slider bounds from the locked ratio", () => {
    // When
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasSizingMode="native-image"
        canvasAspect={{ w: 29, h: 36 }}
        canvasWidth={3712}
        canvasHeight={4608}
      />,
    );

    // Then
    const bounds = canvasStepBounds({ w: 29, h: 36 });
    const slider = screen.getByLabelText("Canvas size step");
    expect(slider.getAttribute("min")).toBe(String(bounds.min));
    expect(slider.getAttribute("max")).toBe(String(bounds.max));
    expect(slider).toHaveValue("128");
  });
});
