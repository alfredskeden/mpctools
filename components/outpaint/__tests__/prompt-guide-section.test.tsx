import { render, screen } from "@testing-library/react";
import { PromptGuideSection } from "../prompt-guide-section";

describe("PromptGuideSection", () => {
  it("renders the section label as an h2", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(screen.getByRole("heading", { level: 2, name: "How to prompt Gemini" })).toBeDefined();
  });

  it("renders the subtitle", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(screen.getByText("5 steps · best results")).toBeDefined();
  });

  it("renders all five step numbers", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(screen.getByText("01")).toBeDefined();
    expect(screen.getByText("02")).toBeDefined();
    expect(screen.getByText("03")).toBeDefined();
    expect(screen.getByText("04")).toBeDefined();
    expect(screen.getByText("05")).toBeDefined();
  });

  it("renders all five card headings as h3 elements", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(screen.getByRole("heading", { level: 3, name: "Set the scene clearly" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Name the grey zones" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Match the lighting" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Keep style consistent" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Iterate if needed" })).toBeDefined();
  });

  it("renders all five card descriptions", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    expect(
      screen.getByText(/Describe what's in your image before giving/),
    ).toBeDefined();
    expect(
      screen.getByText(/Reference the grey border areas explicitly/),
    ).toBeDefined();
    expect(screen.getByText(/Mention the lighting direction and mood/)).toBeDefined();
    expect(screen.getByText(/Describe the art style/)).toBeDefined();
    expect(
      screen.getByText(/If the first result has seams or odd fills/),
    ).toBeDefined();
  });

  it("renders an image for each tip", () => {
    // Given / When
    render(<PromptGuideSection />);

    // Then
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(5);
  });
});
