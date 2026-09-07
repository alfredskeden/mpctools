import { render, screen } from "@testing-library/react";
import PadderScrubPage from "./page";

describe("PadderScrubPage", () => {
  it("renders the padder scrub prompt guide", () => {
    // Given / When
    render(<PadderScrubPage />);

    // Then
    expect(screen.getAllByTestId(/^padder-copy-/)).toHaveLength(3);
  });
});
