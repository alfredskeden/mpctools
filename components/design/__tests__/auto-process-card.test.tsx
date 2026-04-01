import { render, screen } from "@testing-library/react";
import { AutoProcessCard } from "../auto-process-card";

describe("AutoProcessCard", () => {
  it("shows spinner when processing", () => {
    // When
    render(
      <AutoProcessCard
        isProcessing={true}
        grayBorderDataUrl={null}
        fileName={null}
      />,
    );

    // Then
    expect(screen.getByTestId("processing-spinner")).toBeDefined();
  });

  it("shows preview when processing is complete", () => {
    // When
    render(
      <AutoProcessCard
        isProcessing={false}
        grayBorderDataUrl="data:image/png;base64,abc"
        fileName="card.png"
      />,
    );

    // Then
    expect(screen.getByRole("img")).toBeDefined();
    expect(screen.queryByTestId("processing-spinner")).toBeNull();
  });

  it("renders nothing when not processing and no data", () => {
    // When
    const { container } = render(
      <AutoProcessCard
        isProcessing={false}
        grayBorderDataUrl={null}
        fileName={null}
      />,
    );

    // Then
    expect(container.innerHTML).toBe("");
  });

  it("uses default file name when fileName is null", () => {
    // When
    render(
      <AutoProcessCard
        isProcessing={false}
        grayBorderDataUrl="data:image/png;base64,abc"
        fileName={null}
      />,
    );

    // Then
    expect(screen.getByRole("img")).toBeDefined();
  });
});
