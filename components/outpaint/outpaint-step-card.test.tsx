import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintStepCard } from "./outpaint-step-card";

const defaultProps = {
  stepNumber: 1,
  title: "THE HANDSHAKE",
  codeText: "Some prompt text",
  isActive: true,
  onCopy: vi.fn(),
  copied: false,
};

describe("OutpaintStepCard", () => {
  it("renders step number and title", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
  });

  it("renders code text", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByText("Some prompt text")).toBeDefined();
  });

  it("shows Copy button when active", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Copy" })).toBeDefined();
  });

  it("shows Copied! when copied is true", () => {
    render(<OutpaintStepCard {...defaultProps} copied={true} />);

    expect(screen.getByText("Copied!")).toBeDefined();
  });

  it("calls onCopy when Copy button is clicked", async () => {
    const onCopy = vi.fn();
    render(<OutpaintStepCard {...defaultProps} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it("hides Copy button when inactive", () => {
    render(<OutpaintStepCard {...defaultProps} isActive={false} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies opacity when inactive", () => {
    const { container } = render(
      <OutpaintStepCard {...defaultProps} isActive={false} />,
    );

    expect(container.firstElementChild?.className).toContain("opacity-35");
  });

  it("renders hint text when active and provided", () => {
    render(
      <OutpaintStepCard
        {...defaultProps}
        hintText="Copy this prompt and send it"
      />,
    );

    expect(screen.getByText("Copy this prompt and send it")).toBeDefined();
  });

  it("hides hint text when inactive even if provided", () => {
    render(
      <OutpaintStepCard
        {...defaultProps}
        isActive={false}
        hintText="Copy this prompt and send it"
      />,
    );

    expect(screen.queryByText("Copy this prompt and send it")).toBeNull();
  });

  it("renders inactive badge with border instead of fill", () => {
    render(<OutpaintStepCard {...defaultProps} isActive={false} />);

    const badge = screen.getByText("1").parentElement!;
    expect(badge.className).toContain("border-surface-muted");
  });

  it("renders active badge with blue fill", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    const badge = screen.getByText("1").parentElement!;
    expect(badge.className).toContain("bg-accent-blue");
  });

  it("uses primary text color for title when active", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    const title = screen.getByText("THE HANDSHAKE");
    expect(title.className).toContain("text-text-primary");
  });

  it("uses secondary text color for title when inactive", () => {
    render(<OutpaintStepCard {...defaultProps} isActive={false} />);

    const title = screen.getByText("THE HANDSHAKE");
    expect(title.className).toContain("text-text-secondary");
  });

  it("uses dimmed code text when inactive", () => {
    render(<OutpaintStepCard {...defaultProps} isActive={false} />);

    const code = screen.getByText("Some prompt text");
    expect(code.className).toContain("text-text-tertiary");
  });
});
