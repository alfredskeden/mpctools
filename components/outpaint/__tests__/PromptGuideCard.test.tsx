import { render, screen, fireEvent } from "@testing-library/react";
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
      screen.getAllByAltText("Example of a clearly described scene in an outpaint prompt")[0],
    ).toBeDefined();
  });

  it("renders the image with the correct src", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    const img = screen.getAllByAltText("Example of a clearly described scene in an outpaint prompt")[0] as HTMLImageElement;
    expect(img.src).toContain("/images/prompt-guide-01.jpg");
  });

  it("forwards loading prop to the thumbnail image", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} loading="eager" />);

    // Then
    const img = screen.getAllByAltText("Example of a clearly described scene in an outpaint prompt")[0] as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("eager");
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

  it("does not show a dialog by default", () => {
    // Given / When
    render(<PromptGuideCard {...defaultProps} />);

    // Then
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a dialog when the image button is clicked", () => {
    // Given
    render(<PromptGuideCard {...defaultProps} />);
    const button = screen.getByRole("button", { name: /full size/i });

    // When
    fireEvent.click(button);

    // Then
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("shows the image inside the dialog", () => {
    // Given
    render(<PromptGuideCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /full size/i }));

    // When
    const dialog = screen.getByRole("dialog");
    const imgs = dialog.querySelectorAll("img");

    // Then
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].alt).toBe("Example of a clearly described scene in an outpaint prompt");
  });

  it("closes the dialog when the close button is clicked", () => {
    // Given
    render(<PromptGuideCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /full size/i }));
    expect(screen.getByRole("dialog")).toBeDefined();

    // When
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    // Then
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
