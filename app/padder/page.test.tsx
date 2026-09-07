import { render, screen } from "@testing-library/react";
import PadderPage from "./page";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

describe("PadderPage", () => {
  it("renders the padder tool", () => {
    // Given / When
    render(<PadderPage />);

    // Then
    expect(screen.getByTestId("padder-upload-btn")).toBeDefined();
  });
});
