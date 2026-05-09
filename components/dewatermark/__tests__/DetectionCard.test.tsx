import { render, screen } from "@testing-library/react";

import { DetectionCard } from "@/components/dewatermark/DetectionCard";

describe("DetectionCard", () => {
  it("formats the corner abbreviation, confidence percentage, and alpha gain", () => {
    // Given/When
    render(
      <DetectionCard
        corner="bottom-right"
        source="adaptive"
        alphaGain={1.05}
        confidence={0.873}
      />,
    );

    // Then
    expect(screen.getByTestId("detection-row-corner").textContent).toContain(
      "BR",
    );
    expect(screen.getByTestId("detection-row-source").textContent).toContain(
      "adaptive",
    );
    expect(
      screen.getByTestId("detection-row-alpha gain").textContent,
    ).toContain("1.05×");
    expect(screen.getByTestId("detection-confidence").textContent).toBe("87%");
  });

  it("falls back to em-dash when no corner is present and source is preset", () => {
    // Given/When
    render(
      <DetectionCard
        corner=""
        source="preset"
        alphaGain={1}
        confidence={0.74}
      />,
    );

    // Then
    expect(screen.getByTestId("detection-row-corner").textContent).toContain(
      "—",
    );
  });

  it("reports 'No watermark detected' when corner is empty and source is non-preset", () => {
    // Given/When
    render(
      <DetectionCard
        corner=""
        source="adaptive"
        alphaGain={1}
        confidence={0.5}
      />,
    );

    // Then
    expect(screen.getByTestId("detection-card").textContent).toContain(
      "No watermark detected",
    );
  });

  it("uppercases unfamiliar corner identifiers", () => {
    // Given/When
    render(
      <DetectionCard
        corner="centre"
        source="custom"
        alphaGain={1.1}
        confidence={0.9}
      />,
    );

    // Then
    expect(screen.getByTestId("detection-row-corner").textContent).toContain(
      "CENTRE",
    );
  });
});
