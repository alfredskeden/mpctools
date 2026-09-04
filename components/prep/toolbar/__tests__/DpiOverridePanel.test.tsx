import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DpiOverridePanel } from "../panels/DpiOverridePanel";

const noop = () => {};

const defaultProps = {
  dpiOverride: null as number | null,
  onSetDpiOverride: noop,
};

describe("DpiOverridePanel", () => {
  it("renders DPI input with empty value when no override", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(screen.getByLabelText("DPI value")).toHaveValue(null);
  });

  it("renders DPI input with current value when override is set", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={300} />);
    expect(screen.getByLabelText("DPI value")).toHaveValue(300);
  });

  it("shows scale factor when DPI is set", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={300} />);
    expect(screen.getByText(/Scale factor:/)).toBeInTheDocument();
    expect(screen.getByText("(400%)")).toBeInTheDocument();
  });

  it("does not show scale factor when DPI is null", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(screen.queryByText(/Scale factor/)).not.toBeInTheDocument();
  });

  it("calls onSetDpiOverride when DPI input changes", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    const input = screen.getByLabelText("DPI value");
    await userEvent.type(input, "300");
    expect(onSetDpiOverride).toHaveBeenCalled();
  });

  it("calls onSetDpiOverride with null when input is cleared", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        dpiOverride={300}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    const input = screen.getByLabelText("DPI value");
    await userEvent.clear(input);
    expect(onSetDpiOverride).toHaveBeenLastCalledWith(null);
  });

  it("renders DPI preset buttons", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3); // 270, 300, Clear Override
  });

  it("calls onSetDpiOverride with 270 when 270 DPI preset is clicked", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /270 dpi/i }));
    expect(onSetDpiOverride).toHaveBeenCalledWith(270);
  });

  it("calls onSetDpiOverride with 300 when 300 DPI preset is clicked", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /300 dpi/i }));
    expect(onSetDpiOverride).toHaveBeenCalledWith(300);
  });

  it("calls onSetDpiOverride with null when clear override is clicked", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        dpiOverride={300}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onSetDpiOverride).toHaveBeenCalledWith(null);
  });

  it("marks 270 DPI preset as active when dpiOverride is 270", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={270} />);
    const button = screen.getByRole("button", { name: /270 dpi/i });
    expect(button.getAttribute("data-active")).toBe("true");
  });

  it("marks 300 DPI preset as active when dpiOverride is 300", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={300} />);
    const button = screen.getByRole("button", { name: /300 dpi/i });
    expect(button.getAttribute("data-active")).toBe("true");
  });
});

describe("DpiOverridePanel disabled state", () => {
  it("disables every control when the disabled flag is given", () => {
    // When
    render(<DpiOverridePanel {...defaultProps} disabled />);

    // Then
    expect(screen.getByLabelText("DPI value")).toBeDisabled();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("keeps every control enabled without the disabled flag", () => {
    // When
    render(<DpiOverridePanel {...defaultProps} />);

    // Then
    expect(screen.getByLabelText("DPI value")).toBeEnabled();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeEnabled();
    }
  });
});
