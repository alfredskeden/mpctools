import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageDropZone } from "./image-drop-zone";

function mockFileReaderAndImage(dataUrl: string) {
  const OriginalFileReader = globalThis.FileReader;
  const OriginalImage = globalThis.Image;

  const onImageLoad = vi.fn();

  class MockFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    readAsDataURL() {
      this.onload?.({ target: { result: dataUrl } });
    }
  }

  class MockImage {
    onload: (() => void) | null = null;
    private _src = "";
    get src() {
      return this._src;
    }
    set src(val: string) {
      this._src = val;
      this.onload?.();
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);
  vi.stubGlobal("Image", MockImage);

  return {
    restore() {
      vi.stubGlobal("FileReader", OriginalFileReader);
      vi.stubGlobal("Image", OriginalImage);
    },
    onImageLoad,
  };
}

describe("ImageDropZone", () => {
  it("renders the drop zone with upload label", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Upload image" }),
    ).toBeDefined();
  });

  it("renders instructional text", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    expect(screen.getByText("Drop image here")).toBeDefined();
    expect(screen.getByText("or click to browse")).toBeDefined();
  });

  it("has a hidden file input", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
    expect(input.className).toContain("hidden");
  });

  it("opens file dialog on click", async () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    await userEvent.click(
      screen.getByRole("button", { name: "Upload image" }),
    );

    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Enter key", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.keyDown(dropZone, { key: "Enter" });

    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Space key", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.keyDown(dropZone, { key: " " });

    expect(clickSpy).toHaveBeenCalled();
  });

  it("applies dragging styles on dragOver", () => {
    const { container } = render(<ImageDropZone onImageLoad={vi.fn()} />);

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });

    const innerZone = container.querySelector(".border-dashed");
    expect(innerZone?.className).toContain("border-accent-blue");
  });

  it("removes dragging styles on dragLeave", () => {
    const { container } = render(<ImageDropZone onImageLoad={vi.fn()} />);

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });

    const innerZone = container.querySelector(".border-dashed");
    expect(innerZone?.className).not.toContain("border-accent-blue");
  });

  it("processes dropped image file", () => {
    const onImageLoad = vi.fn();
    const dataUrl = "data:image/png;base64,cGl4ZWxz";
    const mocks = mockFileReaderAndImage(dataUrl);

    render(<ImageDropZone onImageLoad={onImageLoad} />);

    const file = new File(["pixels"], "card.png", { type: "image/png" });

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onImageLoad).toHaveBeenCalledWith(dataUrl, expect.anything());

    mocks.restore();
  });

  it("ignores non-image files on drop", () => {
    const onImageLoad = vi.fn();
    render(<ImageDropZone onImageLoad={onImageLoad} />);

    const file = new File(["text"], "readme.txt", { type: "text/plain" });

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onImageLoad).not.toHaveBeenCalled();
  });

  it("handles drop with no files", () => {
    const onImageLoad = vi.fn();
    render(<ImageDropZone onImageLoad={onImageLoad} />);

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [] },
    });

    expect(onImageLoad).not.toHaveBeenCalled();
  });

  it("handles input change with no files", () => {
    const onImageLoad = vi.fn();
    render(<ImageDropZone onImageLoad={onImageLoad} />);

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [] } });

    expect(onImageLoad).not.toHaveBeenCalled();
  });

  it("handles non-Enter/Space key without opening dialog", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    fireEvent.keyDown(dropZone, { key: "Tab" });

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("processes file selected via input", () => {
    const onImageLoad = vi.fn();
    const dataUrl = "data:image/png;base64,cGl4ZWxz";
    const mocks = mockFileReaderAndImage(dataUrl);

    render(<ImageDropZone onImageLoad={onImageLoad} />);

    const file = new File(["pixels"], "card.png", { type: "image/png" });

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(onImageLoad).toHaveBeenCalledWith(dataUrl, expect.anything());

    mocks.restore();
  });

  it("renders with gray background and card aspect ratio", () => {
    render(<ImageDropZone onImageLoad={vi.fn()} />);

    const dropZone = screen.getByRole("button", { name: "Upload image" });
    expect(dropZone.className).toContain("bg-canvas-bg");
    expect(dropZone.className).toContain("aspect-canvas");
  });
});
