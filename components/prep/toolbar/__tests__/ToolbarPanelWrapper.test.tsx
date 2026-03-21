import { render, screen } from "@testing-library/react";
import { ToolbarPanelWrapper } from "../ToolbarPanelWrapper";

describe("ToolbarPanelWrapper", () => {
  it("renders the title", () => {
    render(
      <ToolbarPanelWrapper title="Image Controls">
        <div>content</div>
      </ToolbarPanelWrapper>,
    );
    expect(screen.getByText("Image Controls")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <ToolbarPanelWrapper title="Test">
        <div data-testid="child">Hello</div>
      </ToolbarPanelWrapper>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
