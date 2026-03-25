import { render, screen } from "@testing-library/react";
import { PromptGuideSection } from "../prompt-guide-section";

describe("PromptGuideSection", () => {
  it("renders the section with an h2 heading", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders a subtitle alongside the heading", () => {
    // Given / When
    const { container } = render(<PromptGuideSection />);

    // Then — a span caption exists near the heading
    const caption = container.querySelector("span");
    expect(caption).not.toBeNull();
  });

  it("renders five step cards as h3 headings", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(5);
  });

  it("renders an image for each tip", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(5);
  });
});
