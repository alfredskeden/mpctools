import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "../image-uploader";

// Mock Image constructor that auto-fires onload
const FakeImage = function (this: Record<string, unknown>) {
  this.onload = null;
  let _src = "";
  Object.defineProperty(this, "src", {
    set(val: string) {
      _src = val;
      const onload = this.onload as (() => void) | null;
      if (onload) onload();
    },
    get() {
      return _src;
    },
  });
} as unknown as typeof globalThis.Image;
vi.stubGlobal("Image", FakeImage);

// Mock FileReader that auto-fires onload on readAsDataURL
const FakeFileReader = function (this: Record<string, unknown>) {
  this.result = "data:image/png;base64,abc";
  this.onload = null;
  this.readAsDataURL = () => {
    const onload = this.onload as ((ev: ProgressEvent) => void) | null;
    if (onload) {
      onload({
        target: { result: this.result },
      } as unknown as ProgressEvent);
    }
  };
} as unknown as typeof globalThis.FileReader;
vi.stubGlobal("FileReader", FakeFileReader);

afterEach(() => {
  vi.clearAllMocks();
});

describe("ImageUploader", () => {
  it("renders a file input", () => {
    // When
    render(<ImageUploader onUpload={vi.fn()} />);

    // Then
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDefined();
    expect(input?.getAttribute("accept")).toBe("image/*");
  });

  it("calls onUpload when a valid image is selected", async () => {
    // Given
    const onUpload = vi.fn();
    render(<ImageUploader onUpload={onUpload} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["pixels"], "card.png", { type: "image/png" });

    // When
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledOnce();
    });
    expect(onUpload.mock.calls[0][1]).toBe("card.png");
  });

  it("ignores non-image files", () => {
    // Given
    const onUpload = vi.fn();
    render(<ImageUploader onUpload={onUpload} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["text"], "doc.txt", { type: "text/plain" });

    // When
    fireEvent.change(input, { target: { files: [file] } });

    // Then
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("ignores empty file selection", () => {
    // Given
    const onUpload = vi.fn();
    render(<ImageUploader onUpload={onUpload} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // When
    fireEvent.change(input, { target: { files: [] } });

    // Then
    expect(onUpload).not.toHaveBeenCalled();
  });
});
