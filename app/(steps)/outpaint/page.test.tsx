import { render, screen } from "@testing-library/react";
import OutpaintPage from "./page";

describe("OutpaintPage", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders inside a main element", () => {
    render(<OutpaintPage />);

    expect(screen.getByRole("main")).toBeDefined();
  });

  it("shows both step cards with copy buttons", () => {
    render(<OutpaintPage />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(2);
  });
});
