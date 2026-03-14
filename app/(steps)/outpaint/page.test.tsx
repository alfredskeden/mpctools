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

  it("shows the handshake step card", () => {
    render(<OutpaintPage />);

    expect(screen.getByText("THE HANDSHAKE")).toBeDefined();
  });

  it("shows the outpaint command step card", () => {
    render(<OutpaintPage />);

    expect(screen.getByText("OUTPAINT COMMAND")).toBeDefined();
  });
});
