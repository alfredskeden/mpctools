import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useClickOutside } from "../use-click-outside";

function createPointerEvent(target: EventTarget) {
  return new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
  });
}

describe("useClickOutside", () => {
  it("calls callback when clicking outside the ref element", () => {
    const callback = vi.fn();
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    outer.appendChild(inner);
    document.body.appendChild(outer);

    renderHook(() => {
      const ref = useRef<HTMLElement>(inner);
      useClickOutside(ref, callback);
    });

    outer.dispatchEvent(createPointerEvent(outer));
    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(outer);
  });

  it("does not call callback when clicking inside the ref element", () => {
    const callback = vi.fn();
    const container = document.createElement("div");
    const inner = document.createElement("div");
    container.appendChild(inner);
    document.body.appendChild(container);

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useClickOutside(ref, callback);
    });

    inner.dispatchEvent(createPointerEvent(inner));
    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it("does not call callback when enabled is false", () => {
    const callback = vi.fn();
    const inner = document.createElement("div");
    document.body.appendChild(inner);

    renderHook(() => {
      const ref = useRef<HTMLElement>(inner);
      useClickOutside(ref, callback, false);
    });

    document.body.dispatchEvent(createPointerEvent(document.body));
    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(inner);
  });

  it("removes event listener on unmount", () => {
    const callback = vi.fn();
    const inner = document.createElement("div");
    document.body.appendChild(inner);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(inner);
      useClickOutside(ref, callback);
    });

    unmount();

    document.body.dispatchEvent(createPointerEvent(document.body));
    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(inner);
  });

  it("handles null ref without throwing", () => {
    const callback = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      useClickOutside(ref, callback);
    });

    document.body.dispatchEvent(createPointerEvent(document.body));
    expect(callback).not.toHaveBeenCalled();
  });
});
