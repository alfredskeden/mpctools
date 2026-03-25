import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanvasSizePanel, computeAspectRatio } from "../panels/CanvasSizePanel";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";

const noop = () => {};

const defaultProps = {
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  onSetCanvasSize: noop,
};

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
