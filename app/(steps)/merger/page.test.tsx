import { render, screen } from "@testing-library/react";
import MergerPage from "./page";

describe("MergerPage", () => {
  it("renders inside a main element", () => {
    render(<MergerPage />);

    expect(screen.getByRole("main")).toBeDefined();
  });
});
