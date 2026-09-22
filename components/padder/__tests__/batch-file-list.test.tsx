import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchFileList } from "../batch-file-list";
import type { BatchRow } from "@/hooks/use-padder-batch";

const counts = { total: 0, succeeded: 0, failed: 0, pending: 0 };
const progress = { processed: 0, total: 0, current: "" };

function pending(name: string): BatchRow {
  return { name, size: 100, type: "image/png", status: "pending" };
}

function success(name: string, crop: number): BatchRow {
  return {
    name,
    size: 100,
    type: "image/png",
    status: "success",
    canvasWidth: 816,
    canvasHeight: 1110,
    cropPixels: crop,
  };
}

function failed(name: string): BatchRow {
  return { name, size: 100, type: "image/png", status: "failed", reason: "not-portrait" };
}

describe("BatchFileList", () => {
  it("renders nothing when there are no rows", () => {
    // Given / When
    const { container } = render(
      <BatchFileList rows={[]} counts={counts} progress={progress} isRunning={false} />,
    );

    // Then
    expect(container.firstChild).toBeNull();
  });

  it("renders one row per file", () => {
    // Given
    const rows = [pending("a.png"), pending("b.png")];

    // When
    render(<BatchFileList rows={rows} counts={{ ...counts, total: 2, pending: 2 }} progress={progress} isRunning={false} />);

    // Then
    expect(screen.getAllByTestId("batch-row")).toHaveLength(2);
  });

  it("marks each row with its status and failure reason", () => {
    // Given
    const rows = [success("a.png", 0), failed("wide.png")];

    // When
    render(<BatchFileList rows={rows} counts={{ total: 2, succeeded: 1, failed: 1, pending: 0 }} progress={progress} isRunning={false} />);

    // Then
    const items = screen.getAllByTestId("batch-row");
    expect(items[0].getAttribute("data-status")).toBe("success");
    expect(items[1].getAttribute("data-status")).toBe("failed");
    expect(items[1].getAttribute("data-reason")).toBe("not-portrait");
  });

  it("shows canvas size only once a scan has been padded", () => {
    // Given
    const rows = [success("a.png", 0), pending("b.png")];

    // When
    render(<BatchFileList rows={rows} counts={{ total: 2, succeeded: 1, failed: 0, pending: 1 }} progress={progress} isRunning={false} />);

    // Then
    expect(screen.getAllByTestId("batch-row-canvas")).toHaveLength(1);
  });

  it("shows a crop figure only for a scan that loses pixels", () => {
    // Given
    const rows = [success("cropped.png", 12), success("clean.png", 0)];

    // When
    render(<BatchFileList rows={rows} counts={{ total: 2, succeeded: 2, failed: 0, pending: 0 }} progress={progress} isRunning={false} />);

    // Then
    expect(screen.getAllByTestId("batch-row-crop")).toHaveLength(1);
  });

  it("exposes summary counts as data attributes", () => {
    // Given
    const rows = [success("a.png", 0), failed("b.png"), pending("c.png")];

    // When
    render(<BatchFileList rows={rows} counts={{ total: 3, succeeded: 1, failed: 1, pending: 1 }} progress={progress} isRunning={false} />);

    // Then
    const summary = screen.getByTestId("batch-summary");
    expect(summary.getAttribute("data-total")).toBe("3");
    expect(summary.getAttribute("data-succeeded")).toBe("1");
    expect(summary.getAttribute("data-failed")).toBe("1");
    expect(summary.getAttribute("data-pending")).toBe("1");
  });

  it("shows progress while running", () => {
    // Given
    const rows = [pending("a.png")];

    // When
    render(
      <BatchFileList
        rows={rows}
        counts={{ total: 1, succeeded: 0, failed: 0, pending: 1 }}
        progress={{ processed: 1, total: 1, current: "a.png" }}
        isRunning={true}
      />,
    );

    // Then
    const progressEl = screen.getByTestId("batch-progress");
    expect(progressEl.getAttribute("data-processed")).toBe("1");
    expect(progressEl.getAttribute("data-total")).toBe("1");
  });

  it("hides progress when not running", () => {
    // Given
    const rows = [pending("a.png")];

    // When
    render(<BatchFileList rows={rows} counts={{ total: 1, succeeded: 0, failed: 0, pending: 1 }} progress={progress} isRunning={false} />);

    // Then
    expect(screen.queryByTestId("batch-progress")).toBeNull();
  });
});
