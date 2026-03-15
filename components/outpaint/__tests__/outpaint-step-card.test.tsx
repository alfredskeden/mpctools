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

    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
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

  it("shows 'Show more' button by default", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    expect(screen.getByRole("button", { name: /show more/i })).toBeDefined();
  });

  it("text is collapsed by default with max height constraint", () => {
    render(<OutpaintStepCard {...defaultProps} />);

    const codeText = screen.getByText("Some prompt text");
    const textContainer = codeText.parentElement!;
    expect(textContainer.className).toContain("max-h-22");
    expect(textContainer.className).toContain("overflow-hidden");
  });

  it("shows gradient overlay when collapsed", () => {
    const { container } = render(<OutpaintStepCard {...defaultProps} />);

    const gradient = container.querySelector(".bg-gradient-to-t");
    expect(gradient).not.toBeNull();
  });

  it("expands text when 'Show more' is clicked", async () => {
    render(<OutpaintStepCard {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /show more/i }));

    const codeText = screen.getByText("Some prompt text");
    const textContainer = codeText.parentElement!;
    expect(textContainer.className).not.toContain("max-h-22");
    expect(textContainer.className).not.toContain("overflow-hidden");
  });

  it("shows 'Show less' after expanding", async () => {
    render(<OutpaintStepCard {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /show more/i }));

    expect(screen.getByRole("button", { name: /show less/i })).toBeDefined();
  });

  it("hides gradient overlay when expanded", async () => {
    const { container } = render(<OutpaintStepCard {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /show more/i }));

    const gradient = container.querySelector(".bg-gradient-to-t");
    expect(gradient).toBeNull();
  });

  it("collapses text when 'Show less' is clicked", async () => {
    render(<OutpaintStepCard {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: /show more/i }));
    await userEvent.click(screen.getByRole("button", { name: /show less/i }));

    const codeText = screen.getByText("Some prompt text");
    const textContainer = codeText.parentElement!;
    expect(textContainer.className).toContain("max-h-22");
  });

  it("preserves newlines in code text", () => {
    render(
      <OutpaintStepCard {...defaultProps} codeText={"Line one\nLine two"} />,
    );

    const codeText = screen.getByText(/Line one/);
    expect(codeText.className).toContain("whitespace-pre-line");
  });

  it("rotates chevron icon when expanded", async () => {
    render(<OutpaintStepCard {...defaultProps} />);

    const showMoreBtn = screen.getByRole("button", { name: /show more/i });
    const svgBefore = showMoreBtn.querySelector("svg")!;
    expect(svgBefore.className.baseVal).not.toContain("rotate-180");

    await userEvent.click(showMoreBtn);

    const showLessBtn = screen.getByRole("button", { name: /show less/i });
    const svgAfter = showLessBtn.querySelector("svg")!;
    expect(svgAfter.className.baseVal).toContain("rotate-180");
  });
});
