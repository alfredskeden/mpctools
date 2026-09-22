import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BatchDropZone } from "../batch-drop-zone";

function makeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

function fileListOf(...files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
}

function setFilesAndChange(input: HTMLElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: fileListOf(...files),
    configurable: true,
  });
  fireEvent.change(input);
}

describe("BatchDropZone", () => {
  it("emits the image files chosen through the files input", () => {
    // Given
    const onFiles = vi.fn();
    render(<BatchDropZone onFiles={onFiles} folderSupported={false} />);
    const png = makeFile("card.png", "image/png");
    const junk = makeFile(".DS_Store", "");

    // When
    setFilesAndChange(screen.getByTestId("batch-files-input"), [png, junk]);

    // Then
    expect(onFiles).toHaveBeenCalledWith([png]);
  });

  it("does not emit when no image files are chosen", () => {
    // Given
    const onFiles = vi.fn();
    render(<BatchDropZone onFiles={onFiles} folderSupported={false} />);

    // When
    setFilesAndChange(screen.getByTestId("batch-files-input"), [
      makeFile("notes.txt", "text/plain"),
    ]);

    // Then
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("shows the folder button and emits from the folder input when supported", () => {
    // Given
    const onFiles = vi.fn();
    render(<BatchDropZone onFiles={onFiles} folderSupported={true} />);
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});

    // When
    fireEvent.click(screen.getByTestId("batch-folder-btn"));
    setFilesAndChange(screen.getByTestId("batch-folder-input"), [
      makeFile("card.png", "image/png"),
    ]);

    // Then
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(onFiles).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });

  it("hides the folder button when webkitdirectory is unsupported", () => {
    // Given / When
    render(<BatchDropZone onFiles={vi.fn()} folderSupported={false} />);

    // Then
    expect(screen.queryByTestId("batch-folder-btn")).toBeNull();
  });

  it("opens the files input when the files button is clicked", () => {
    // Given
    render(<BatchDropZone onFiles={vi.fn()} folderSupported={false} />);
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});

    // When
    fireEvent.click(screen.getByTestId("batch-files-btn"));

    // Then
    expect(clickSpy).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });

  it("emits image files from a drop", async () => {
    // Given
    const onFiles = vi.fn();
    render(<BatchDropZone onFiles={onFiles} folderSupported={false} />);
    const png = makeFile("card.png", "image/png");

    // When
    fireEvent.drop(screen.getByTestId("batch-drop-zone"), {
      dataTransfer: { files: fileListOf(png) },
    });

    // Then
    await waitFor(() => expect(onFiles).toHaveBeenCalledWith([png]));
  });

  it("ignores a drop that carries no image files", async () => {
    // Given
    const onFiles = vi.fn();
    render(<BatchDropZone onFiles={onFiles} folderSupported={false} />);

    // When
    fireEvent.drop(screen.getByTestId("batch-drop-zone"), {
      dataTransfer: { files: fileListOf(makeFile("x.txt", "text/plain")) },
    });

    // Then — allow the async handler to settle, then assert no emit.
    await Promise.resolve();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("prevents default on drag over and renders with detected folder support", () => {
    // Given — omit folderSupported to exercise the default feature detection.
    render(<BatchDropZone onFiles={vi.fn()} />);
    const zone = screen.getByTestId("batch-drop-zone");

    // When
    const prevented = !fireEvent.dragOver(zone);

    // Then
    expect(prevented).toBe(true);
  });
});
