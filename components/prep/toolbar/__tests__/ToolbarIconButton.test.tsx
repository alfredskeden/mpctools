import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Move } from "lucide-react";
import { ToolbarIconButton } from "../ToolbarIconButton";

describe("ToolbarIconButton", () => {
  const defaultProps = {
    icon: Move,
    label: "Image Controls",
    isActive: false,
    disabled: false,
    onClick: vi.fn(),
  };

  it("renders a button with the correct aria-label", () => {
    render(<ToolbarIconButton {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Image Controls" }),
    ).toBeInTheDocument();
  });

  it("sets aria-pressed to true when active", () => {
    render(<ToolbarIconButton {...defaultProps} isActive={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("sets aria-pressed to false when inactive", () => {
    render(<ToolbarIconButton {...defaultProps} isActive={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<ToolbarIconButton {...defaultProps} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<ToolbarIconButton {...defaultProps} disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <ToolbarIconButton {...defaultProps} onClick={onClick} disabled={true} />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
