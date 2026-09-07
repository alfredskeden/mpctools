import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PadderScrubContent } from "../padder-scrub-content";
import { PADDER_TARGET_KEY } from "@/lib/padder-prompts";

const writeText = vi.fn();

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

describe("PadderScrubContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    writeText.mockClear();
  });

  it("renders one copyable step per prompt, including the alternate", () => {
    // Given / When
    render(<PadderScrubContent />);

    // Then
    expect(screen.getAllByTestId(/^padder-copy-/)).toHaveLength(3);
  });

  it("builds the handshake from the stored target's ratio", async () => {
    // Given
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({ width: 736, height: 914, ratioLabel: "29:36" }),
    );
    render(<PadderScrubContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    expect(writeText.mock.calls[0][0]).toContain("29:36");
  });

  it("builds the command from the stored target's ratio", async () => {
    // Given
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({ width: 736, height: 914, ratioLabel: "29:36" }),
    );
    render(<PadderScrubContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-command"));

    // Then
    expect(writeText.mock.calls[0][0]).toContain("29:36");
  });

  it("falls back to the default target's ratio when storage is empty", async () => {
    // Given
    render(<PadderScrubContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    expect(writeText.mock.calls[0][0]).toContain("11:15");
  });

  it("never uses a gcd-reduced ratio in the prompt", async () => {
    // Given
    render(<PadderScrubContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-handshake"));

    // Then
    expect(writeText.mock.calls[0][0]).not.toContain("136:185");
  });

  it("copies the alternate command, which carries no ratio of its own", async () => {
    // Given
    render(<PadderScrubContent />);

    // When
    await userEvent.click(screen.getByTestId("padder-copy-alternate"));

    // Then
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).not.toContain("11:15");
  });

  it("reports the target dimensions on the page", () => {
    // Given
    sessionStorage.setItem(
      PADDER_TARGET_KEY,
      JSON.stringify({ width: 2176, height: 2701, ratioLabel: "29:36" }),
    );

    // When
    render(<PadderScrubContent />);

    // Then
    expect(screen.getByTestId("padder-target-width").textContent).toBe("2176");
    expect(screen.getByTestId("padder-target-height").textContent).toBe("2701");
    expect(screen.getByTestId("padder-target-ratio").textContent).toBe("29:36");
  });

  it("links back to the padder tool", () => {
    // Given / When
    render(<PadderScrubContent />);

    // Then
    expect(screen.getByTestId("padder-back-link").getAttribute("href")).toBe(
      "/padder",
    );
  });
});
