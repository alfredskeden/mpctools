import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintStepCard } from "../outpaint-step-card";

const defaultProps = {
  stepNumber: 1,
  title: "THE HANDSHAKE",
  codeText: "Some prompt text",
  isActive: true,
  onCopy: vi.fn(),
  copied: false,
};

describe("OutpaintStepCard", () => {
  it("renders step number and title from props", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
  });

  it("renders code text in the DOM for copying", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByText("Some prompt text")).toBeDefined();
  });

  it("shows Copy button when active", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Copy" })).toBeDefined();
  });

  it("shows copied state on the copy button when copied is true", () => {
    render(<OutpaintStepCard {...defaultProps} copied={true} />);

    const copySpan = screen.getByRole("button").querySelector("[data-copied='true']");
    expect(copySpan).not.toBeNull();
  });

  it("calls onCopy when Copy button is clicked", async () => {
    const onCopy = vi.fn();
    render(<OutpaintStepCard {...defaultProps} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it("shows Copy button even when inactive", () => {
    render(<OutpaintStepCard {...defaultProps} isActive={false} />);

    expect(screen.getByRole("button", { name: "Copy" })).toBeDefined();
  });

  it("marks the card as inactive when isActive is false", () => {
    const { container } = render(
      <OutpaintStepCard {...defaultProps} isActive={false} />,
    );

    expect(container.querySelector("[data-active='false']")).not.toBeNull();
  });

  it("marks the card as active when isActive is true", () => {
    const { container } = render(
      <OutpaintStepCard {...defaultProps} isActive={true} />,
    );

    expect(container.querySelector("[data-active='true']")).not.toBeNull();
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

  it("renders badge with inactive state when isActive is false", () => {
    const { container } = render(
      <OutpaintStepCard {...defaultProps} isActive={false} />,
    );

    expect(container.querySelector("[data-slot='step-badge'][data-active='false']")).not.toBeNull();
  });

  it("renders badge with active state when isActive is true", () => {
    const { container } = render(<OutpaintStepCard {...defaultProps} />);

    expect(container.querySelector("[data-slot='step-badge'][data-active='true']")).not.toBeNull();
  });
});
