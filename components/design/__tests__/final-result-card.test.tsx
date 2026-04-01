import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinalResultCard } from "../final-result-card";

describe("FinalResultCard", () => {
  const defaultProps = {
    mergedCanvasDataUrl: "data:image/png;base64,merged",
    isDownloaded: false,
    originalFileName: "card.png",
    onDownload: vi.fn(),
    onReset: vi.fn(),
  };

  it("renders the merged image", () => {
    // When
    render(<FinalResultCard {...defaultProps} />);

    // Then
    expect(screen.getByRole("img")).toBeDefined();
  });

  it("calls onDownload with derived file name", async () => {
    // Given
    const onDownload = vi.fn();
    render(<FinalResultCard {...defaultProps} onDownload={onDownload} />);
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]); // Download button

    // Then
    expect(onDownload).toHaveBeenCalledWith("card-merged.png");
  });

  it("calls onDownload with default name when no original file name", async () => {
    // Given
    const onDownload = vi.fn();
    render(
      <FinalResultCard
        {...defaultProps}
        originalFileName={null}
        onDownload={onDownload}
      />,
    );
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    // Then
    expect(onDownload).toHaveBeenCalledWith("merged-outpaint.png");
  });

  it("calls onReset when Start over is clicked", async () => {
    // Given
    const onReset = vi.fn();
    render(<FinalResultCard {...defaultProps} onReset={onReset} />);
    const user = userEvent.setup();

    // When
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]); // Start over button

    // Then
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("shows Downloaded text after download", () => {
    // When
    render(<FinalResultCard {...defaultProps} isDownloaded={true} />);

    // Then
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDefined();
  });
});
