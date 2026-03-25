import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintPageContent } from "../outpaint-page-content";
import { PREP_CANVAS_SIZE_KEY } from "@/hooks/use-prep-workflow";

describe("OutpaintPageContent", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    sessionStorage.clear();
  });

  it("renders both step cards initially", () => {
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(2);
  });

  it("shows both copy buttons initially", () => {
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(2);
  });

  it("shows handshake button initially", () => {
    render(<OutpaintPageContent />);

    expect(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    ).toBeDefined();
  });

  it("shows disabled Continue to Merge initially", () => {
    render(<OutpaintPageContent />);

    const link = screen.getByRole("link", { name: /continue/i });
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });

  it("collapses handshake and activates command after sending handshake", async () => {
    render(<OutpaintPageContent />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    // Handshake is now collapsed with "Sent" label
    expect(screen.getByTestId("sent-label")).toBeDefined();

    // Outpaint command is now active with Copy button
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();

    // Continue to Merge is now enabled
    const link = screen.getByRole("link", { name: /continue/i });
    expect(link.getAttribute("aria-disabled")).toBe("false");
  });

  it("hides handshake button after sending", async () => {
    render(<OutpaintPageContent />);

    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    expect(
      screen.queryByRole("button", { name: /I've sent the handshake/i }),
    ).toBeNull();
  });

  it("expands handshake card when collapsed step is toggled", async () => {
    render(<OutpaintPageContent />);

    // Send handshake to collapse it
    await userEvent.click(
      screen.getByRole("button", { name: /I've sent the handshake/i }),
    );

    expect(screen.getByTestId("sent-label")).toBeDefined();

    // Click collapsed step to expand
    await userEvent.click(
      screen.getByRole("button", { name: /THE HANDSHAKE/i }),
    );

    // Now handshake is expanded (not collapsed), showing as inactive card
    expect(screen.queryByTestId("sent-label")).toBeNull();
    // Both cards visible with copy buttons
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons).toHaveLength(2);
  });

  it("copies handshake prompt when first copy is clicked", async () => {
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await userEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("High-Fidelity Neutral Photo Extender"),
    );
  });

  it("copies outpaint command when second copy is clicked", async () => {
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await userEvent.click(copyButtons[1]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("NEW PROJECT / MEMORY FLUSH"),
    );
  });

  it("uses dynamic aspect ratio from sessionStorage when present", async () => {
    // Given - landscape 4:3 canvas set from prep step
    sessionStorage.setItem(
      PREP_CANVAS_SIZE_KEY,
      JSON.stringify({ width: 3264, height: 2448 }),
    );

    // When
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await userEvent.click(copyButtons[0]);

    // Then
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("4:3 Horizontal Ratio"),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Landscape orientation 4:3 aspect ratio"),
    );
  });

  it("renders the page heading as an h1", () => {
    // Given / When
    render(<OutpaintPageContent />);

    // Then
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("renders the prompt guide section with an h2 heading", () => {
    // Given / When
    render(<OutpaintPageContent />);

    // Then — at least one h2 heading exists (PromptGuideSection has one)
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the instructions aside region with an h2 heading", () => {
    // Given / When
    render(<OutpaintPageContent />);

    // Then
    expect(screen.getByRole("complementary", { name: "Instructions" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Instructions" })).toBeDefined();
  });

  it("falls back to default 11:15 portrait when sessionStorage is empty", async () => {
    // Given - no sessionStorage entry

    // When
    render(<OutpaintPageContent />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await userEvent.click(copyButtons[0]);

    // Then
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("11:15 Vertical Ratio"),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Portrait orientation 11:15 aspect ratio"),
    );
  });
});
