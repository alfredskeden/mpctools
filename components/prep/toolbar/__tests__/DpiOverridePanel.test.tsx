import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DpiOverridePanel } from "../panels/DpiOverridePanel";

const noop = () => {};

const defaultProps = {
  dpiOverride: null as number | null,
  onSetDpiOverride: noop,
};

describe("DpiOverridePanel", () => {
  it("renders description text", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(
      screen.getByText(/Scales the uploaded image based on DPI/),
    ).toBeInTheDocument();
  });

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

  it("renders 270 DPI preset button", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(screen.getByText("270 DPI")).toBeInTheDocument();
  });

  it("renders 300 DPI preset button", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(screen.getByText("300 DPI")).toBeInTheDocument();
  });

  it("calls onSetDpiOverride with 270 when 270 DPI preset is clicked", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    await userEvent.click(screen.getByText("270 DPI"));
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
    await userEvent.click(screen.getByText("300 DPI"));
    expect(onSetDpiOverride).toHaveBeenCalledWith(300);
  });

  it("calls onSetDpiOverride with null when Clear Override is clicked", async () => {
    const onSetDpiOverride = vi.fn();
    render(
      <DpiOverridePanel
        {...defaultProps}
        dpiOverride={300}
        onSetDpiOverride={onSetDpiOverride}
      />,
    );
    await userEvent.click(screen.getByText("Clear Override"));
    expect(onSetDpiOverride).toHaveBeenCalledWith(null);
  });

  it("highlights 270 DPI preset when active", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={270} />);
    const button = screen.getByText("270 DPI").closest("button");
    expect(button?.className).toContain("accent-blue");
  });

  it("highlights 300 DPI preset when active", () => {
    render(<DpiOverridePanel {...defaultProps} dpiOverride={300} />);
    const button = screen.getByText("300 DPI").closest("button");
    expect(button?.className).toContain("accent-blue");
  });

  it("renders Scryfall info note", () => {
    render(<DpiOverridePanel {...defaultProps} />);
    expect(
      screen.getByText(/Scryfall scans are always 300 DPI/),
    ).toBeInTheDocument();
  });
});
