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

  it("renders Default and Classic borderless preset buttons", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Classic borderless")).toBeInTheDocument();
  });

  it("renders ratio preset buttons", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    expect(screen.getByText("1:1")).toBeInTheDocument();
    expect(screen.getByText("4:3")).toBeInTheDocument();
    expect(screen.getByText("16:9")).toBeInTheDocument();
    expect(screen.getByText("3:4")).toBeInTheDocument();
    expect(screen.getByText("9:16")).toBeInTheDocument();
  });

  it("calls onSetCanvasSize when a preset is clicked", async () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    await userEvent.click(screen.getByText("1:1"));
    expect(onSetCanvasSize).toHaveBeenCalledWith(2048, 2048);
  });

  it("highlights the active preset", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    const defaultButton = screen.getByText("Default").closest("button");
    expect(defaultButton?.className).toContain("accent-blue");
  });

  it("does not highlight inactive presets", () => {
    render(<CanvasSizePanel {...defaultProps} />);
    const classicButton = screen
      .getByText("Classic borderless")
      .closest("button");
    expect(classicButton?.className).not.toContain("bg-accent-blue");
  });

  it("highlights active ratio preset", () => {
    render(
      <CanvasSizePanel
        {...defaultProps}
        canvasWidth={2048}
        canvasHeight={2048}
      />,
    );
    const button1to1 = screen.getByText("1:1").closest("button");
    expect(button1to1?.className).toContain("accent-blue");
  });

  it("clicks Classic borderless preset", async () => {
    const onSetCanvasSize = vi.fn();
    render(
      <CanvasSizePanel {...defaultProps} onSetCanvasSize={onSetCanvasSize} />,
    );
    await userEvent.click(screen.getByText("Classic borderless"));
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
