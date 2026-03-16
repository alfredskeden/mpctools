import { render, screen, fireEvent } from "@testing-library/react";
import {
  MobileInstructionCarousel,
  type CarouselStep,
} from "../mobile-instruction-carousel";

const steps: CarouselStep[] = [
  {
    number: 1,
    title: "First step",
    status: "active",
    content: <p>Step 1 content</p>,
  },
  {
    number: 2,
    title: "Second step",
    status: "upcoming",
    content: <p>Step 2 content</p>,
  },
  {
    number: 3,
    title: "Third step",
    status: "upcoming",
    content: <p>Step 3 content</p>,
  },
];

describe("MobileInstructionCarousel", () => {
  it("renders the initial step title and content", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={0} />);

    expect(screen.getByText("First step")).toBeDefined();
    expect(screen.getByText("Step 1 content")).toBeDefined();
  });

  it("navigates forward when right chevron is clicked", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Next step" }));

    expect(screen.getByText("Second step")).toBeDefined();
    expect(screen.getByText("Step 2 content")).toBeDefined();
  });

  it("navigates backward when left chevron is clicked", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));

    expect(screen.getByText("First step")).toBeDefined();
    expect(screen.getByText("Step 1 content")).toBeDefined();
  });

  it("disables previous button on first step", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={0} />);

    const prevBtn = screen.getByRole("button", { name: "Previous step" });
    expect(prevBtn.hasAttribute("disabled")).toBe(true);
    expect(prevBtn.className).toContain("opacity-35");
  });

  it("disables next button on last step", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={2} />);

    const nextBtn = screen.getByRole("button", { name: "Next step" });
    expect(nextBtn.hasAttribute("disabled")).toBe(true);
    expect(nextBtn.className).toContain("opacity-35");
  });

  it("renders dot indicators with active dot highlighted", () => {
    const { container } = render(
      <MobileInstructionCarousel steps={steps} currentStepIndex={0} />,
    );

    const dots = container.querySelectorAll(".size-1\\.5");
    expect(dots.length).toBe(3);
    expect(dots[0].className).toContain("bg-accent-blue");
    expect(dots[1].className).toContain("bg-surface-muted");
    expect(dots[2].className).toContain("bg-surface-muted");
  });

  it("updates dot indicators when navigating", () => {
    const { container } = render(
      <MobileInstructionCarousel steps={steps} currentStepIndex={0} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next step" }));

    const dots = container.querySelectorAll(".size-1\\.5");
    expect(dots[0].className).toContain("bg-surface-muted");
    expect(dots[1].className).toContain("bg-accent-blue");
  });

  it("auto-advances when currentStepIndex changes", () => {
    const { rerender } = render(
      <MobileInstructionCarousel steps={steps} currentStepIndex={0} />,
    );

    expect(screen.getByText("First step")).toBeDefined();

    const updatedSteps: CarouselStep[] = [
      { ...steps[0], status: "completed" },
      { ...steps[1], status: "active" },
      steps[2],
    ];

    rerender(
      <MobileInstructionCarousel steps={updatedSteps} currentStepIndex={1} />,
    );

    expect(screen.getByText("Second step")).toBeDefined();
    expect(screen.getByText("Step 2 content")).toBeDefined();
  });

  it("applies opacity to upcoming step content", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={0} />);

    // Navigate to an upcoming step
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));

    // The content area should have opacity-35 since step 2 is upcoming
    const content = screen.getByText("Step 2 content").parentElement!;
    expect(content.className).toContain("opacity-35");
  });

  it("uses custom aria-label when provided", () => {
    render(
      <MobileInstructionCarousel
        steps={steps}
        currentStepIndex={0}
        ariaLabel="Merger Steps"
      />,
    );

    expect(
      screen.getByRole("region", { name: "Merger Steps" }),
    ).toBeDefined();
  });

  it("uses default aria-label", () => {
    render(<MobileInstructionCarousel steps={steps} currentStepIndex={0} />);

    expect(
      screen.getByRole("region", { name: "Instructions" }),
    ).toBeDefined();
  });
});
