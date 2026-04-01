import { render, screen } from "@testing-library/react";
import { AutoMergeCard } from "../auto-merge-card";

describe("AutoMergeCard", () => {
  it("shows spinner when merging", () => {
    // When
    render(<AutoMergeCard mergePhase="processing" />);

    // Then
    expect(screen.getByTestId("merge-spinner")).toBeDefined();
  });

  it("renders nothing when idle", () => {
    // When
    const { container } = render(<AutoMergeCard mergePhase="idle" />);

    // Then
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when done", () => {
    // When
    const { container } = render(<AutoMergeCard mergePhase="done" />);

    // Then
    expect(container.innerHTML).toBe("");
  });
});
