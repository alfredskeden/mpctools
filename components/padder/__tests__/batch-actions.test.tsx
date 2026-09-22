import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchActions } from "../batch-actions";

const baseProps = {
  canRun: true,
  isRunning: false,
  canDownload: false,
  onRun: () => {},
  onCancel: () => {},
  onDownload: () => {},
};

describe("BatchActions", () => {
  it("runs the batch when the run button is clicked", () => {
    // Given
    const onRun = vi.fn();
    render(<BatchActions {...baseProps} onRun={onRun} />);

    // When
    fireEvent.click(screen.getByTestId("batch-run-btn"));

    // Then
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("disables the run button when a run is not possible", () => {
    // Given / When
    render(<BatchActions {...baseProps} canRun={false} />);

    // Then
    expect(screen.getByTestId("batch-run-btn")).toHaveProperty("disabled", true);
  });

  it("swaps the run button for a cancel button while running", () => {
    // Given
    const onCancel = vi.fn();
    render(<BatchActions {...baseProps} isRunning={true} onCancel={onCancel} />);

    // When
    fireEvent.click(screen.getByTestId("batch-cancel-btn"));

    // Then
    expect(screen.queryByTestId("batch-run-btn")).toBeNull();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("downloads the zip when the download button is enabled and clicked", () => {
    // Given
    const onDownload = vi.fn();
    render(<BatchActions {...baseProps} canDownload={true} onDownload={onDownload} />);

    // When
    fireEvent.click(screen.getByTestId("batch-download-btn"));

    // Then
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("disables the download button when there is nothing to download", () => {
    // Given / When
    render(<BatchActions {...baseProps} canDownload={false} />);

    // Then
    expect(screen.getByTestId("batch-download-btn")).toHaveProperty("disabled", true);
  });
});
