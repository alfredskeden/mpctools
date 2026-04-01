import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutpaintHandoff } from "../outpaint-handoff";

vi.mock("@/hooks/use-clipboard", () => ({
  useCopyToClipboard: () => ({ copied: false, copy: vi.fn() }),
}));

describe("OutpaintHandoff", () => {
  const defaultProps = {
    handshakePrompt: "handshake text",
    outpaintCommand: "outpaint command text",
    grayBorderDataUrl: null,
    dewatermarkPhase: "idle" as const,
    dewatermarkError: null,
    onUploadOutpaint: vi.fn(),
  };

  it("renders two prompt blocks with copy buttons", () => {
    // When
    render(<OutpaintHandoff {...defaultProps} />);

    // Then
    const copyButtons = screen.getAllByRole("button");
    expect(copyButtons).toHaveLength(2);
  });

  it("shows upload zone when dewatermark is idle", () => {
    // When
    render(<OutpaintHandoff {...defaultProps} />);

    // Then
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDefined();
  });

  it("shows spinner when dewatermark is processing", () => {
    // When
    render(
      <OutpaintHandoff {...defaultProps} dewatermarkPhase="processing" />,
    );

    // Then
    expect(screen.getByTestId("dewatermark-spinner")).toBeDefined();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("shows success when dewatermark is done", () => {
    // When
    render(<OutpaintHandoff {...defaultProps} dewatermarkPhase="done" />);

    // Then
    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByTestId("dewatermark-spinner")).toBeNull();
  });

  it("shows error message when dewatermark fails", () => {
    // When
    render(
      <OutpaintHandoff
        {...defaultProps}
        dewatermarkPhase="error"
        dewatermarkError="Decode failed"
      />,
    );

    // Then
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("shows fallback error when dewatermarkError is null", () => {
    // When
    render(
      <OutpaintHandoff
        {...defaultProps}
        dewatermarkPhase="error"
        dewatermarkError={null}
      />,
    );

    // Then
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("calls onUploadOutpaint when a file is selected", () => {
    // Given
    const onUploadOutpaint = vi.fn();
    render(
      <OutpaintHandoff {...defaultProps} onUploadOutpaint={onUploadOutpaint} />,
    );
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["px"], "outpaint.png", { type: "image/png" });

    // When
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    expect(onUploadOutpaint).toHaveBeenCalledWith(file);
  });

  it("ignores non-image file upload", () => {
    // Given
    const onUploadOutpaint = vi.fn();
    render(
      <OutpaintHandoff {...defaultProps} onUploadOutpaint={onUploadOutpaint} />,
    );
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["text"], "doc.txt", { type: "text/plain" });

    // When
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    expect(onUploadOutpaint).not.toHaveBeenCalled();
  });

  it("shows gray border image preview when available", () => {
    // When
    render(
      <OutpaintHandoff
        {...defaultProps}
        grayBorderDataUrl="data:image/png;base64,abc"
      />,
    );

    // Then
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("ignores empty file selection", () => {
    // Given
    const onUploadOutpaint = vi.fn();
    render(
      <OutpaintHandoff {...defaultProps} onUploadOutpaint={onUploadOutpaint} />,
    );
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // When
    fireEvent.change(input, { target: { files: [] } });

    // Then
    expect(onUploadOutpaint).not.toHaveBeenCalled();
  });
});
