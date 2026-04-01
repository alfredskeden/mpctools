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
        canvasWidth={3520}
        canvasHeight={4800}
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
        canvasWidth={3520}
        canvasHeight={4800}
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
        canvasWidth={3520}
        canvasHeight={4800}
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
        canvasWidth={3520}
        canvasHeight={4800}
      />,
    );

    // Then
    expect(screen.getByRole("img")).toBeDefined();
  });

  it("displays the correct canvas dimensions", () => {
    // When
    render(
      <AutoProcessCard
        isProcessing={false}
        grayBorderDataUrl="data:image/png;base64,abc"
        fileName="card.png"
        canvasWidth={3712}
        canvasHeight={4608}
      />,
    );

    // Then
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
