import { renderHook } from "@testing-library/react";
import { usePasteImage } from "../use-paste-image";

type StubItem = {
  type: string;
  getAsFile: () => File | null;
};

function pasteEvent(items: StubItem[] | null) {
  const event = new Event("paste", {
    bubbles: true,
    cancelable: true,
  }) as Event & { clipboardData: unknown };
  Object.defineProperty(event, "clipboardData", {
    value: items === null ? null : { items },
    configurable: true,
  });
  return event;
}

const imageFile = () => new File(["scan"], "clip.png", { type: "image/png" });

describe("usePasteImage", () => {
  it("hands a pasted image file to the caller", () => {
    // Given
    const onFile = vi.fn();
    const file = imageFile();
    renderHook(() => usePasteImage(onFile));

    // When
    window.dispatchEvent(
      pasteEvent([{ type: "image/png", getAsFile: () => file }]),
    );

    // Then
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("takes the first image when other clipboard content comes first", () => {
    // Given
    const onFile = vi.fn();
    const file = imageFile();
    renderHook(() => usePasteImage(onFile));

    // When
    window.dispatchEvent(
      pasteEvent([
        { type: "text/plain", getAsFile: () => null },
        { type: "image/png", getAsFile: () => file },
      ]),
    );

    // Then
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("prevents the default paste once it takes an image", () => {
    // Given
    renderHook(() => usePasteImage(vi.fn()));
    const event = pasteEvent([
      { type: "image/png", getAsFile: () => imageFile() },
    ]);

    // When
    window.dispatchEvent(event);

    // Then
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores a paste carrying no image", () => {
    // Given
    const onFile = vi.fn();
    renderHook(() => usePasteImage(onFile));

    // When
    window.dispatchEvent(
      pasteEvent([{ type: "text/plain", getAsFile: () => null }]),
    );

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });

  it("ignores an image entry that yields no file", () => {
    // Given
    const onFile = vi.fn();
    renderHook(() => usePasteImage(onFile));

    // When
    window.dispatchEvent(
      pasteEvent([{ type: "image/png", getAsFile: () => null }]),
    );

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });

  it("ignores a paste with no clipboard data at all", () => {
    // Given
    const onFile = vi.fn();
    renderHook(() => usePasteImage(onFile));

    // When
    window.dispatchEvent(pasteEvent(null));

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    // Given
    const onFile = vi.fn();
    const { unmount } = renderHook(() => usePasteImage(onFile));

    // When
    unmount();
    window.dispatchEvent(
      pasteEvent([{ type: "image/png", getAsFile: () => imageFile() }]),
    );

    // Then
    expect(onFile).not.toHaveBeenCalled();
  });
});
