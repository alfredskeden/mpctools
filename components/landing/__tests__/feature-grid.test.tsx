import { render, screen } from "@testing-library/react";
import { FeatureGrid } from "../feature-grid";

describe("FeatureGrid", () => {
  it("renders a section heading", () => {
    render(<FeatureGrid />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders four feature headings", () => {
    render(<FeatureGrid />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });
});
