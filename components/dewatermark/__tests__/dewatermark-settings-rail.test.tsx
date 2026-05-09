import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DewatermarkSettingsRail } from "@/components/dewatermark/dewatermark-settings-rail";
import {
  DEWATERMARK_DEFAULTS,
  type DewatermarkSettings,
} from "@/hooks/use-dewatermark-workspace";

type Props = Parameters<typeof DewatermarkSettingsRail>[0];

const baseImage = {
  name: "card.png",
  size: 2048,
  width: 880,
  height: 1200,
};

function renderRail(overrides: Partial<Props> = {}) {
  const props: Props = {
    hasImage: true,
    imageMeta: baseImage,
    settings: DEWATERMARK_DEFAULTS,
    detection: {
      corner: "bottom-right",
      confidence: 0.92,
      alphaGain: 1.05,
      source: "adaptive",
    },
    isProcessing: false,
    isDirty: false,
    onPatch: vi.fn(),
    onReset: vi.fn(),
    onUploadFile: vi.fn(),
    onDownload: vi.fn(),
    ...overrides,
  };
  render(<DewatermarkSettingsRail {...props} />);
  return props;
}

describe("DewatermarkSettingsRail", () => {
  it("renders the source card with file metadata when an image is loaded", () => {
    // Given/When
    renderRail();

    // Then
    expect(screen.getByTestId("rail-source-file").textContent).toBe("card.png");
    expect(screen.getByTestId("rail-source-card").textContent).toContain(
      "880×1200",
    );
  });

  it("hides the source card and shows the upload CTA when no image is loaded", () => {
    // Given/When
    renderRail({ hasImage: false, imageMeta: null });

    // Then
    expect(screen.queryByTestId("rail-source-card")).toBeNull();
    expect(screen.queryByTestId("rail-upload-label")).not.toBeNull();
  });

  it("forwards patches from each control to onPatch", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderRail();

    // When — toggle adaptive
    await user.click(screen.getByTestId("rail-toggle-adaptive"));
    // Pick a corner
    await user.click(screen.getAllByRole("radio")[2]);
    // Move every slider
    fireEvent.change(screen.getByLabelText("Mask expansion"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Confidence threshold"), {
      target: { value: "0.55" },
    });
    fireEvent.change(screen.getByLabelText("Feather"), {
      target: { value: "0.3" },
    });
    fireEvent.change(screen.getByLabelText("Post lightness"), {
      target: { value: "-0.2" },
    });
    fireEvent.change(screen.getByLabelText("Alpha gain"), {
      target: { value: "1.4" },
    });
    // Change format
    fireEvent.change(screen.getByTestId("rail-output-format"), {
      target: { value: "jpeg" },
    });

    // Then
    expect(props.onPatch).toHaveBeenCalledWith({ adaptive: true });
    expect(props.onPatch).toHaveBeenCalledWith({ corner: "tr" });
    expect(props.onPatch).toHaveBeenCalledWith({ maskExpand: 9 });
    expect(props.onPatch).toHaveBeenCalledWith({ confidenceThreshold: 0.55 });
    expect(props.onPatch).toHaveBeenCalledWith({ feather: 0.3 });
    expect(props.onPatch).toHaveBeenCalledWith({ postLightness: -0.2 });
    expect(props.onPatch).toHaveBeenCalledWith({ alphaGain: 1.4 });
    expect(props.onPatch).toHaveBeenCalledWith({ exportFormat: "jpeg" });
  });

  it("formats post-lightness with explicit + sign for positive values and bytes appropriately", () => {
    // Given/When
    renderRail({
      settings: {
        ...DEWATERMARK_DEFAULTS,
        postLightness: 0.25,
      },
    });

    // Then — value chip on the post-lightness slider shows the +0.25 prefix
    expect(
      screen.getByTestId("rail-post-lightness-value").textContent,
    ).toBe("+0.25");
  });

  it("renders source size with KB-formatted bytes", () => {
    // Given/When
    renderRail({
      imageMeta: { ...baseImage, size: 4096 },
    });

    // Then
    expect(screen.getByTestId("rail-source-card").textContent).toContain(
      "4.0 KB",
    );
  });

  it("renders source size with MB-formatted bytes", () => {
    // Given/When
    renderRail({
      imageMeta: { ...baseImage, size: 5 * 1024 * 1024 },
    });

    // Then
    expect(screen.getByTestId("rail-source-card").textContent).toContain(
      "5.00 MB",
    );
  });

  it("renders source size with byte units for sub-KB sizes", () => {
    // Given/When
    renderRail({
      imageMeta: { ...baseImage, size: 600 },
    });

    // Then
    expect(screen.getByTestId("rail-source-card").textContent).toContain(
      "600 B",
    );
  });

  it("formats negative post-lightness without a leading + sign", () => {
    // Given/When
    renderRail({
      settings: { ...DEWATERMARK_DEFAULTS, postLightness: -0.15 },
    });

    // Then
    expect(
      screen.getByTestId("rail-post-lightness-value").textContent,
    ).toBe("-0.15");
  });

  it("ignores rail upload-input change when no file is selected", () => {
    // Given
    const props = renderRail({ hasImage: false, imageMeta: null });
    const input = screen.getByTestId("rail-upload-input") as HTMLInputElement;

    // When
    fireEvent.change(input, { target: { files: [] } });

    // Then
    expect(props.onUploadFile).not.toHaveBeenCalled();
  });

  it("falls back to em-dash in size when bytes is zero", () => {
    // Given/When
    renderRail({
      imageMeta: { ...baseImage, size: 0 },
    });

    // Then
    expect(screen.getByTestId("rail-source-card").textContent).toContain("—");
  });

  it("disables every interactive control while processing", () => {
    // Given/When
    renderRail({ isProcessing: true });

    // Then
    expect(
      (screen.getByTestId("rail-toggle-adaptive") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Mask expansion") as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("rail-output-format") as HTMLSelectElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("rail-download") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("disables the auto-detect link when corner is already auto", () => {
    // Given/When
    renderRail();

    // Then
    expect(
      (screen.getByTestId("rail-corner-auto-detect") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("re-enables auto-detect and clicking patches corner back to auto", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderRail({
      settings: { ...DEWATERMARK_DEFAULTS, corner: "tl" } as DewatermarkSettings,
    });

    // When
    await user.click(screen.getByTestId("rail-corner-auto-detect"));

    // Then
    expect(props.onPatch).toHaveBeenCalledWith({ corner: "auto" });
  });

  it("invokes onReset when reset all is clicked", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderRail({ isDirty: true });

    // When
    await user.click(screen.getByTestId("rail-reset-all"));

    // Then
    expect(props.onReset).toHaveBeenCalledOnce();
  });

  it("disables reset all when not dirty", () => {
    // Given/When
    renderRail({ isDirty: false });

    // Then
    expect(
      (screen.getByTestId("rail-reset-all") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("does not render the detection card when detection is null", () => {
    // Given/When
    renderRail({ detection: null });

    // Then
    expect(screen.queryByTestId("detection-card")).toBeNull();
  });

  it("emits onUploadFile from the upload label input when no image is loaded", async () => {
    // Given
    const props = renderRail({ hasImage: false, imageMeta: null });
    const input = screen.getByTestId("rail-upload-input") as HTMLInputElement;
    const file = new File(["x"], "rail.png", { type: "image/png" });

    // When
    await userEvent.upload(input, file);

    // Then
    expect(props.onUploadFile).toHaveBeenCalledOnce();
    expect((props.onUploadFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].name).toBe(
      "rail.png",
    );
  });

  it("invokes onDownload when the rail Download button is clicked", async () => {
    // Given
    const user = userEvent.setup();
    const props = renderRail();

    // When
    await user.click(screen.getByTestId("rail-download"));

    // Then
    expect(props.onDownload).toHaveBeenCalledOnce();
  });

  it("shows a guidance copy when no image is present", () => {
    // Given/When
    renderRail({ hasImage: false, imageMeta: null });

    // Then
    expect(
      screen.getByLabelText("Dewatermark settings").textContent,
    ).toContain("Upload an image to begin");
  });
});
