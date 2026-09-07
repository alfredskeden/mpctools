import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PadderPageContent } from "../padder-page-content";
import { PADDER_TARGET_KEY } from "@/lib/padder-prompts";
import * as mergerUtils from "@/lib/merger-utils";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.spyOn(mergerUtils, "downloadCanvasAsBlob").mockImplementation(() => {});

/** Drive the hidden file input the way a user's file picker would. */
async function uploadScan(width: number, height: number, name = "scan.png") {
  const file = new File(["scan"], name, { type: "image/png" });
  const input = screen.getByTestId("padder-file-input");

  // A real canvas element stands in for the Image: the padder draws it, and
  // the canvas mock only accepts genuine drawable elements.
  const originalImage = window.Image;
  window.Image = function StubImage() {
    const element = document.createElement("canvas") as HTMLCanvasElement & {
      onload: (() => void) | null;
      src: string;
    };
    element.width = width;
    element.height = height;
    element.onload = null;
    Object.defineProperty(element, "src", {
      set() {
        queueMicrotask(() => element.onload?.());
      },
    });
    return element;
  } as unknown as typeof Image;

  await userEvent.upload(input, file);
  await waitFor(() =>
    expect(
      screen.queryByTestId("padder-canvas") ??
        screen.queryByTestId("padder-error"),
    ).toBeTruthy(),
  );
  window.Image = originalImage;
}

/** Paste an image file the way a browser would, with the same stub Image. */
async function pasteScan(width: number, height: number, name = "clip.png") {
  const file = new File(["scan"], name, { type: "image/png" });
  const originalImage = window.Image;
  window.Image = function StubImage() {
    const element = document.createElement("canvas") as HTMLCanvasElement & {
      onload: (() => void) | null;
      src: string;
    };
    element.width = width;
    element.height = height;
    element.onload = null;
    Object.defineProperty(element, "src", {
      set() {
        queueMicrotask(() => element.onload?.());
      },
    });
    return element;
  } as unknown as typeof Image;

  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { items: [{ type: "image/png", getAsFile: () => file }] },
    configurable: true,
  });
  window.dispatchEvent(event);

  await waitFor(() =>
    expect(screen.queryByTestId("padder-canvas")).toBeTruthy(),
  );
  window.Image = originalImage;
}

describe("PadderPageContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(mergerUtils.downloadCanvasAsBlob).mockClear();
  });

  it("offers the upload affordance and no preview before an upload", () => {
    // Given / When
    render(<PadderPageContent />);

    // Then
    expect(screen.getByTestId("padder-upload-btn")).toBeDefined();
    expect(screen.queryByTestId("padder-canvas")).toBeNull();
  });

  it("exposes no control that scales, moves or resizes the canvas", () => {
    // Given / When
    render(<PadderPageContent />);

    // Then
    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });

  it("opens the file picker from the upload affordance", async () => {
    // Given
    render(<PadderPageContent />);
    const input = screen.getByTestId("padder-file-input");
    const click = vi.spyOn(input, "click").mockImplementation(() => {});

    // When
    await userEvent.click(screen.getByTestId("padder-upload-btn"));

    // Then
    expect(click).toHaveBeenCalledOnce();
  });

  it("reports the resulting canvas after an upload", async () => {
    // Given
    render(<PadderPageContent />);

    // When
    await uploadScan(745, 1040);

    // Then
    expect(screen.getByTestId("target-width").textContent).toBe("816");
    expect(screen.getByTestId("target-height").textContent).toBe("1110");
  });

  it("changes the reported canvas when the target changes", async () => {
    // Given
    render(<PadderPageContent />);
    await uploadScan(745, 1040);

    // When
    await userEvent.click(screen.getByTestId("target-option-classic-borderless"));

    // Then
    expect(screen.getByTestId("target-height").textContent).toBe("1013");
    expect(screen.getByTestId("crop-note").textContent).toContain("62");
  });

  it("surfaces the error state and blocks download for a non-portrait scan", async () => {
    // Given
    render(<PadderPageContent />);

    // When
    await uploadScan(1040, 745, "landscape.png");

    // Then
    expect(screen.getByTestId("padder-error")).toBeDefined();
    expect(
      screen.getByTestId("padder-download-btn").hasAttribute("disabled"),
    ).toBe(true);
  });

  it("downloads the padded PNG and unlocks continuing", async () => {
    // Given
    render(<PadderPageContent />);
    await uploadScan(745, 1040);

    // When
    await userEvent.click(screen.getByTestId("padder-download-btn"));

    // Then
    expect(mergerUtils.downloadCanvasAsBlob).toHaveBeenCalledWith(
      expect.anything(),
      "padded_scan.png",
    );
    expect(
      screen.getByTestId("padder-continue-link").getAttribute("aria-disabled"),
    ).toBe("false");
  });

  it("stores the padded target for the scrub page", async () => {
    // Given
    render(<PadderPageContent />);

    // When
    await uploadScan(745, 1040);

    // Then
    expect(
      JSON.parse(sessionStorage.getItem(PADDER_TARGET_KEY) ?? "{}"),
    ).toEqual({ width: 816, height: 1110, ratioLabel: "11:15" });
  });

  it("pads an image pasted from the clipboard", async () => {
    // Given
    render(<PadderPageContent />);

    // When
    await pasteScan(672, 936);

    // Then
    expect(screen.getByTestId("target-width").textContent).toBe("736");
    expect(screen.getByTestId("target-height").textContent).toBe("1001");
  });

  it("names the download after a pasted image that has no file name", async () => {
    // Given
    render(<PadderPageContent />);
    await pasteScan(745, 1040, "");

    // When
    await userEvent.click(screen.getByTestId("padder-download-btn"));

    // Then
    expect(mergerUtils.downloadCanvasAsBlob).toHaveBeenCalledWith(
      expect.anything(),
      "padded_pasted-scan.png",
    );
  });

  it("ignores a change event that carries no file", () => {
    // Given
    render(<PadderPageContent />);
    const input = screen.getByTestId("padder-file-input");
    Object.defineProperty(input, "files", { value: null, configurable: true });

    // When
    fireEvent.change(input);

    // Then
    expect(screen.queryByTestId("padder-canvas")).toBeNull();
  });

  it("ignores a non-image file forced past the picker's filter", () => {
    // Given
    render(<PadderPageContent />);
    const input = screen.getByTestId("padder-file-input");
    const file = new File(["nope"], "notes.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });

    // When
    fireEvent.change(input);

    // Then
    expect(screen.queryByTestId("padder-canvas")).toBeNull();
  });
});
