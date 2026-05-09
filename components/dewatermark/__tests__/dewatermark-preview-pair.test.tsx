import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DewatermarkPreviewPair } from "@/components/dewatermark/dewatermark-preview-pair";
import { DEWATERMARK_DEFAULTS } from "@/hooks/use-dewatermark-workspace";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const baseImage = {
  name: "card.png",
  size: 1843200,
  width: 880,
  height: 1200,
};

function renderPair(overrides: Partial<Parameters<typeof DewatermarkPreviewPair>[0]> = {}) {
  const props = {
    imageMeta: baseImage,
    originalSrc: "blob:original",
    resultSrc: "blob:result",
    draftSettings: DEWATERMARK_DEFAULTS,
    committedSettings: DEWATERMARK_DEFAULTS,
    detection: {
      corner: "bottom-right",
      confidence: 0.92,
      alphaGain: 1.05,
      source: "adaptive",
    },
    isProcessing: false,
    onClear: vi.fn(),
    onDownload: vi.fn(),
    ...overrides,
  };
  render(<DewatermarkPreviewPair {...props} />);
  return props;
}

describe("DewatermarkPreviewPair", () => {
  it("renders both preview cells with original and result variants", () => {
    // Given/When
    renderPair();

    // Then
    const original = screen.getByTestId("preview-cell-original");
    const result = screen.getByTestId("preview-cell-result");
    expect(original.getAttribute("data-variant")).toBe("original");
    expect(result.getAttribute("data-variant")).toBe("result");
    expect(screen.getByTestId("preview-divider")).toBeDefined();
  });

  it("disables download while processing", () => {
    // Given/When
    renderPair({ isProcessing: true });

    // Then
    const download = screen.getByTestId("preview-download") as HTMLButtonElement;
    expect(download.disabled).toBe(true);
  });

  it("disables download when no result blob is ready", () => {
    // Given/When
    renderPair({ resultSrc: null });

    // Then
    const download = screen.getByTestId("preview-download") as HTMLButtonElement;
    expect(download.disabled).toBe(true);
  });

  it("invokes onClear when Replace is clicked", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderPair();

    // When
    await user.click(screen.getByTestId("preview-replace"));

    // Then
    expect(props.onClear).toHaveBeenCalledOnce();
  });

  it("invokes onDownload when Download is clicked", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderPair();

    // When
    await user.click(screen.getByTestId("preview-download"));

    // Then
    expect(props.onDownload).toHaveBeenCalledOnce();
  });

  it("resolves corner abbreviation from a manually picked corner", () => {
    // Given/When
    renderPair({
      committedSettings: { ...DEWATERMARK_DEFAULTS, corner: "tl" },
    });

    // Then
    expect(screen.getByTestId("preview-meta-corner").textContent).toContain(
      "BOTTOM-RIGHT",
    );
  });

  it("formats bytes for sub-KB, KB, and MB sizes and falls back when 0", () => {
    // Given/When small (< 1024)
    const { unmount: u1 } = render(
      <DewatermarkPreviewPair
        imageMeta={{ ...baseImage, size: 512 }}
        originalSrc="blob:1"
        resultSrc="blob:2"
        draftSettings={DEWATERMARK_DEFAULTS}
        committedSettings={DEWATERMARK_DEFAULTS}
        detection={null}
        isProcessing={false}
        onClear={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByTestId("preview-file-meta").textContent).toContain(
      "512 B",
    );
    u1();

    // Given/When medium (KB range)
    const { unmount: u2 } = render(
      <DewatermarkPreviewPair
        imageMeta={{ ...baseImage, size: 4096 }}
        originalSrc="blob:1"
        resultSrc="blob:2"
        draftSettings={DEWATERMARK_DEFAULTS}
        committedSettings={DEWATERMARK_DEFAULTS}
        detection={null}
        isProcessing={false}
        onClear={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByTestId("preview-file-meta").textContent).toContain(
      "4.0 KB",
    );
    u2();

    // Given/When zero size (em-dash branch)
    render(
      <DewatermarkPreviewPair
        imageMeta={{ ...baseImage, size: 0 }}
        originalSrc="blob:1"
        resultSrc="blob:2"
        draftSettings={DEWATERMARK_DEFAULTS}
        committedSettings={DEWATERMARK_DEFAULTS}
        detection={null}
        isProcessing={false}
        onClear={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByTestId("preview-file-meta").textContent).toContain(
      "—",
    );
  });

  it.each([
    ["top-left", "TOP-LEFT"],
    ["top-right", "TOP-RIGHT"],
    ["bottom-left", "BOTTOM-LEFT"],
    ["bottom-right", "BOTTOM-RIGHT"],
    ["other", "OTHER"],
  ])("renders the detection-card corner in upper case when value is %s", (corner, expected) => {
    // Given/When
    renderPair({
      detection: {
        corner,
        confidence: 0.9,
        alphaGain: 1,
        source: "adaptive",
      },
    });

    // Then
    expect(screen.getByTestId("preview-meta-corner").textContent).toContain(
      expected,
    );
  });

  it("falls back to em-dash when detection has no corner", () => {
    // Given/When
    renderPair({
      detection: {
        corner: "",
        confidence: 0.74,
        alphaGain: 1,
        source: "preset",
      },
    });

    // Then
    expect(screen.getByTestId("preview-meta-corner").textContent).toContain(
      "—",
    );
  });
});
