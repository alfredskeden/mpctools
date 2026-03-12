import { render, screen } from "@testing-library/react";
import PrepPage from "./page";

describe("PrepPage", () => {
  it("renders the prep page content", () => {
    render(<PrepPage />);

    expect(screen.getByText("Prepare Image")).toBeDefined();
  });

  it("renders inside a main element", () => {
    render(<PrepPage />);

    expect(screen.getByRole("main")).toBeDefined();
  });

  it("shows the image drop zone initially", () => {
    render(<PrepPage />);

    expect(
      screen.getByRole("button", { name: "Upload image" }),
    ).toBeDefined();
  });
});
