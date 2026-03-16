import { renderHook, act } from "@testing-library/react";
import { useRepeatOnHold } from "../use-repeat-on-hold";

describe("useRepeatOnHold", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback immediately on pointerDown", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRepeatOnHold(callback));

    act(() => {
      result.current.onPointerDown();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("repeats callback after initial delay when held", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRepeatOnHold(callback));

    act(() => {
      result.current.onPointerDown();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(callback).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.onPointerUp();
    });
  });

  it("stops repeating on pointerUp", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRepeatOnHold(callback));

    act(() => {
      result.current.onPointerDown();
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    const callCount = callback.mock.calls.length;

    act(() => {
      result.current.onPointerUp();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(callCount);
  });

  it("stops repeating on pointerLeave", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRepeatOnHold(callback));

    act(() => {
      result.current.onPointerDown();
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    const callCount = callback.mock.calls.length;

    act(() => {
      result.current.onPointerLeave();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(callCount);
  });

  it("does not repeat if released before initial delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useRepeatOnHold(callback));

    act(() => {
      result.current.onPointerDown();
    });

    act(() => {
      result.current.onPointerUp();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
