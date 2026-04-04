import { renderHook, act } from "@testing-library/react";
import { useScryfallSearch } from "../use-scryfall-search";
import type { ScryfallCard } from "@/lib/scryfall-types";

const mockCard: ScryfallCard = {
  id: "abc123",
  name: "Lightning Bolt",
  mana_cost: "{R}",
  type_line: "Instant",
  oracle_text: "Lightning Bolt deals 3 damage to any target.",
  image_uris: {
    small: "https://example.com/small.jpg",
    normal: "https://example.com/normal.jpg",
    large: "https://example.com/large.jpg",
    png: "https://example.com/png.png",
    art_crop: "https://example.com/art_crop.jpg",
    border_crop: "https://example.com/border_crop.jpg",
  },
  set_name: "Alpha",
  artist: "Christopher Rush",
  color_identity: ["R"],
};

describe("useScryfallSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initializes with empty state", () => {
    // Given / When
    const { result } = renderHook(() => useScryfallSearch());

    // Then
    expect(result.current.query).toBe("");
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("updates query immediately when setQuery is called", () => {
    // Given
    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("Lightning");
    });

    // Then
    expect(result.current.query).toBe("Lightning");
  });

  it("clears suggestions immediately when query is set to empty string", () => {
    // Given
    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("");
    });

    // Then
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("clears suggestions immediately when query is only whitespace", () => {
    // Given
    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("   ");
    });

    // Then
    expect(result.current.suggestions).toEqual([]);
  });

  it("fetches autocomplete suggestions after 300ms debounce", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: ["Lightning Bolt", "Lightning Strike"] }),
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("Lightning");
    });

    // Not called yet (debounce)
    expect(fetch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then
    expect(fetch).toHaveBeenCalledWith(
      "https://api.scryfall.com/cards/autocomplete?q=Lightning",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.suggestions).toEqual([
      "Lightning Bolt",
      "Lightning Strike",
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it("sets loading true while fetching suggestions", async () => {
    // Given
    let resolveJson!: (value: unknown) => void;
    const jsonPromise = new Promise((res) => { resolveJson = res; });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => jsonPromise,
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("Lightning");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then - loading while awaiting json
    expect(result.current.isLoading).toBe(true);

    // Cleanup
    await act(async () => {
      resolveJson({ data: [] });
    });
  });

  it("sets error when autocomplete fetch fails", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("xyz");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then
    expect(result.current.error).toBe("Failed to load suggestions");
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error when autocomplete fetch throws", async () => {
    // Given
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("xyz");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then
    expect(result.current.error).toBe("Failed to load suggestions");
  });

  it("does not set error when autocomplete is aborted", async () => {
    // Given
    const abortError = new DOMException("Aborted", "AbortError");
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    act(() => {
      result.current.setQuery("abc");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then - AbortError is silently ignored
    expect(result.current.error).toBeNull();
  });

  it("debounces rapid successive queries", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: ["Lightning Bolt"] }),
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When - rapid typing
    act(() => {
      result.current.setQuery("L");
    });
    act(() => {
      result.current.setQuery("Li");
    });
    act(() => {
      result.current.setQuery("Lig");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Then - only one fetch call for final value
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.scryfall.com/cards/autocomplete?q=Lig",
      expect.any(Object),
    );
  });

  it("fetches full card data when selectCard is called", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCard),
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    await act(async () => {
      await result.current.selectCard("Lightning Bolt");
    });

    // Then
    expect(fetch).toHaveBeenCalledWith(
      "https://api.scryfall.com/cards/named?fuzzy=Lightning%20Bolt",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.selectedCard).toEqual(mockCard);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when selectCard fetch fails", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    await act(async () => {
      await result.current.selectCard("Nonexistent Card");
    });

    // Then
    expect(result.current.error).toBe("Failed to load card");
    expect(result.current.selectedCard).toBeNull();
  });

  it("sets error when selectCard fetch throws", async () => {
    // Given
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useScryfallSearch());

    // When
    await act(async () => {
      await result.current.selectCard("Lightning Bolt");
    });

    // Then
    expect(result.current.error).toBe("Failed to load card");
  });

  it("does not set error when selectCard is aborted", async () => {
    // Given
    const abortError = new DOMException("Aborted", "AbortError");
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useScryfallSearch());

    // When
    await act(async () => {
      await result.current.selectCard("Lightning Bolt");
    });

    // Then
    expect(result.current.error).toBeNull();
  });

  it("resets all state when clearCard is called", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCard),
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    await act(async () => {
      await result.current.selectCard("Lightning Bolt");
    });

    // When
    act(() => {
      result.current.clearCard();
    });

    // Then
    expect(result.current.query).toBe("");
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("aborts in-flight selectCard request when selectCard is called again", async () => {
    // Given - first call never resolves (simulates in-flight request)
    let resolveFirst!: (value: unknown) => void;
    const firstPromise = new Promise((res) => { resolveFirst = res; });
    vi.mocked(fetch)
      .mockReturnValueOnce(firstPromise as Promise<Response>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCard),
      } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    // Start first request (does not resolve yet)
    act(() => {
      result.current.selectCard("Lightning Bolt");
    });

    // When - call selectCard again while first is in-flight (exercises line 107)
    await act(async () => {
      await result.current.selectCard("Lightning Strike");
    });

    // Then - second request completed successfully
    expect(result.current.selectedCard).toEqual(mockCard);

    // Cleanup - resolve the first promise to avoid unhandled rejection
    resolveFirst({ ok: false });
  });

  it("cleans up debounce timer and aborts fetch on unmount", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: ["Lightning Bolt"] }),
    } as Response);

    const { result, unmount } = renderHook(() => useScryfallSearch());

    act(() => {
      result.current.setQuery("Lightning");
    });

    // When - unmount before debounce fires
    unmount();

    // Then - no state updates, no errors
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
  });

  it("clears previous error when new query is typed", async () => {
    // Given
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useScryfallSearch());

    act(() => {
      result.current.setQuery("xyz");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.error).toBe("Failed to load suggestions");

    // When
    act(() => {
      result.current.setQuery("abc");
    });

    // Then
    expect(result.current.error).toBeNull();
  });
});
