import { render, screen } from "@testing-library/react";
import PadderOutpaintPage from "./page";

describe("PadderOutpaintPage", () => {
  it("renders the padder prompt guide", () => {
    // Given / When
    render(<PadderOutpaintPage />);

    // Then
    expect(screen.getAllByTestId(/^padder-copy-/)).toHaveLength(2);
  });
});
