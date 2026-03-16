import { renderHook, act } from "@testing-library/react";
import { useCarousel } from "../use-carousel";

describe("useCarousel", () => {
  it("initializes visibleIndex to currentStepIndex", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 1 }),
    );

    expect(result.current.visibleIndex).toBe(1);
  });

  it("canGoBack is false on first step", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 0 }),
    );

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(true);
  });

  it("canGoForward is false on last step", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 2 }),
    );

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it("goForward advances visibleIndex", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 0 }),
    );

    act(() => result.current.goForward());
    expect(result.current.visibleIndex).toBe(1);
  });

  it("goBack decreases visibleIndex", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 2 }),
    );

    act(() => result.current.goBack());
    expect(result.current.visibleIndex).toBe(1);
  });

  it("does not go below 0", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 0 }),
    );

    act(() => result.current.goBack());
    expect(result.current.visibleIndex).toBe(0);
  });

  it("does not go above totalSteps - 1", () => {
    const { result } = renderHook(() =>
      useCarousel({ totalSteps: 3, currentStepIndex: 2 }),
    );

    act(() => result.current.goForward());
    expect(result.current.visibleIndex).toBe(2);
  });

  it("syncs visibleIndex when currentStepIndex changes", () => {
    const { result, rerender } = renderHook(
      ({ currentStepIndex }) =>
        useCarousel({ totalSteps: 3, currentStepIndex }),
      { initialProps: { currentStepIndex: 0 } },
    );

    expect(result.current.visibleIndex).toBe(0);

    rerender({ currentStepIndex: 1 });
    expect(result.current.visibleIndex).toBe(1);
  });

  it("allows navigating after auto-advance", () => {
    const { result, rerender } = renderHook(
      ({ currentStepIndex }) =>
        useCarousel({ totalSteps: 3, currentStepIndex }),
      { initialProps: { currentStepIndex: 0 } },
    );

    rerender({ currentStepIndex: 1 });
    expect(result.current.visibleIndex).toBe(1);

    act(() => result.current.goBack());
    expect(result.current.visibleIndex).toBe(0);
  });
});
