import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PadderOutpaintContent } from "../padder-outpaint-content";
import { PADDER_TARGET_KEY } from "@/lib/padder-prompts";

const writeText = vi.fn();

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

describe("PadderOutpaintContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    writeText.mockClear();
  });

  it("renders one copyable step per prompt", () => {
    // Given / When
    render(<PadderOutpaintContent />);

    // Then
    expect(screen.getAllByTestId(/^padder-copy-/)).toHaveLength(2);
  });

  it("builds the prompt from the stored target", async () => {
    // Given
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({ width: 1632, height: 2026, ratioLabel: "29:36" }),
    );
    render(<PadderOutpaintContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("1632");
    expect(copied).toContain("2026");
    expect(copied).toContain("29:36");
  });

  it("falls back to the 300 DPI default target when storage is empty", async () => {
    // Given
    render(<PadderOutpaintContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("816");
    expect(copied).toContain("1110");
    expect(copied).toContain("11:15");
  });

  it("never uses a gcd-reduced ratio in the prompt", async () => {
    // Given
    render(<PadderOutpaintContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    expect(writeText.mock.calls[0][0]).not.toContain("136:185");
  });

  it("copies the outpaint command", async () => {
    // Given
    render(<PadderOutpaintContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-command"));

    // Then
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toContain("MEMORY FLUSH");
  });

  it("reports the target dimensions on the page", () => {
    // Given
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({ width: 2176, height: 2701, ratioLabel: "29:36" }),
    );

    // When
    render(<PadderOutpaintContent />);

    // Then
    expect(screen.getByTestId("padder-target-width").textContent).toBe("2176");
    expect(screen.getByTestId("padder-target-height").textContent).toBe("2701");
    expect(screen.getByTestId("padder-target-ratio").textContent).toBe("29:36");
  });

  it("links back to the padder tool", () => {
    // Given / When
    render(<PadderOutpaintContent />);

    // Then
    expect(screen.getByTestId("padder-back-link").getAttribute("href")).toBe(
      "/padder",
    );
  });
});
