import { render, screen } from "@testing-library/react";
import { PromptGuideCard } from "../PromptGuideCard";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

describe("PromptGuideCard", () => {
  const defaultProps = {
    stepNumber: "01",
    heading: "Set the scene clearly",
    description: "Describe what's in your image before giving the outpaint instruction.",
    imageSrc: "/images/prompt-guide-01.jpg",
    imageAlt: "Example of a clearly described scene in an outpaint prompt",
  };

  it("renders the step number", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    expect(screen.getByText("01")).toBeDefined();
  });

  it("renders the heading as an h3", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    expect(screen.getByRole("heading", { level: 3, name: "Set the scene clearly" })).toBeDefined();
  });

  it("renders the description", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    expect(
      screen.getByText(
        "Describe what's in your image before giving the outpaint instruction.",
      ),
    ).toBeDefined();
  });

  it("renders the image with the correct alt text", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    expect(
      screen.getByAltText("Example of a clearly described scene in an outpaint prompt"),
    ).toBeDefined();
  });

  it("renders the image with the correct src", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    const img = screen.getByAltText("Example of a clearly described scene in an outpaint prompt") as HTMLImageElement;
    expect(img.src).toContain("/images/prompt-guide-01.jpg");
  });

  it("applies additional className to the card wrapper", () => {
    // Given / When
    const { container } = render(
      <PromptGuideCard {...defaultProps} className="custom-class" />,
    );

    // Then
    expect(container.firstChild).toHaveProperty("className");
    expect(
      (container.firstChild as HTMLElement).className,
    ).toContain("custom-class");
  });
});
