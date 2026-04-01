import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard, useCopyImageToClipboard } from "../use-clipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with copied = false", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("sets copied to true after copy", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
  });

  it("resets copied after 2 seconds", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("clears previous timeout on subsequent copy", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("first");
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await result.current.copy("second");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Still true because second copy restarted the timer
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.copied).toBe(false);
  });

  it("cleans up timeout on unmount", async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("hello");
    });

    unmount();

    // Should not throw or cause state updates
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});

describe("useCopyImageToClipboard", () => {
  const mockBlob = new Blob(["px"], { type: "image/png" });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) }));
    vi.stubGlobal("ClipboardItem", class { constructor(public items: Record<string, Blob>) {} });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with copied = false", () => {
    const { result } = renderHook(() => useCopyImageToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("copies image blob to clipboard", async () => {
    const { result } = renderHook(() => useCopyImageToClipboard());

    await act(async () => {
      await result.current.copyImage("data:image/png;base64,abc");
    });

    expect(fetch).toHaveBeenCalledWith("data:image/png;base64,abc");
    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(result.current.copied).toBe(true);
  });

  it("resets copied after 2 seconds", async () => {
    const { result } = renderHook(() => useCopyImageToClipboard());

    await act(async () => {
      await result.current.copyImage("data:image/png;base64,abc");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("clears previous timeout on subsequent copy", async () => {
    const { result } = renderHook(() => useCopyImageToClipboard());

    await act(async () => {
      await result.current.copyImage("data:image/png;base64,first");
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await result.current.copyImage("data:image/png;base64,second");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.copied).toBe(false);
  });

  it("cleans up timeout on unmount", async () => {
    const { result, unmount } = renderHook(() => useCopyImageToClipboard());

    await act(async () => {
      await result.current.copyImage("data:image/png;base64,abc");
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});
