import { render, screen } from "@testing-library/react";
import PrepPage from "./page";

vi.mock("react-konva");

describe("PrepPage", () => {
  it("renders inside a main element", () => {
    render(<PrepPage />);

    expect(screen.getByRole("main")).toBeDefined();
  });

  it("shows the upload button initially", () => {
    render(<PrepPage />);

    expect(screen.getAllByText("Upload Now").length).toBeGreaterThanOrEqual(1);
  });
});
