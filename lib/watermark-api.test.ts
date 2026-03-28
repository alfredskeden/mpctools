import { removeWatermark, WatermarkApiError } from "./watermark-api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

function makeSuccessResponse(
  overrides: Partial<Record<string, string>> = {},
) {
  const headers = new Headers({
    "content-type": "image/png",
    "x-detection-corner": "bottom-right",
    "x-detection-confidence": "0.87",
    "x-detection-alpha-gain": "1.05",
    "x-detection-source": "adaptive",
    ...overrides,
  });
  const blob = new Blob(["fake-png"], { type: "image/png" });
  return new Response(blob, { status: 200, headers });
}

function makeErrorResponse(status: number, body: string) {
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

describe("removeWatermark", () => {
  it("sends FormData with image to the API endpoint", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValue(makeSuccessResponse());

    // When
    await removeWatermark(file);

    // Then
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/watermark-remove");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("image")).toBe(file);
  });

  it("returns blob and parsed metadata on success", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValue(makeSuccessResponse());

    // When
    const result = await removeWatermark(file);

    // Then
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.metadata).toEqual({
      corner: "bottom-right",
      confidence: 0.87,
      alphaGain: 1.05,
      source: "adaptive",
    });
  });

  it("parses metadata from custom header values", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValue(
      makeSuccessResponse({
        "x-detection-corner": "top-left",
        "x-detection-confidence": "0.42",
        "x-detection-alpha-gain": "1.30",
        "x-detection-source": "preset",
      }),
    );

    // When
    const result = await removeWatermark(file);

    // Then
    expect(result.metadata).toEqual({
      corner: "top-left",
      confidence: 0.42,
      alphaGain: 1.3,
      source: "preset",
    });
  });

  it("throws WatermarkApiError on non-200 response", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValueOnce(makeErrorResponse(422, "Failed to decode image"));

    // When
    const promise = removeWatermark(file);

    // Then
    await expect(promise).rejects.toThrow(WatermarkApiError);
  });

  it("includes status and message in WatermarkApiError", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValueOnce(makeErrorResponse(422, "Failed to decode image"));

    // When
    const error = await removeWatermark(file).catch((e: unknown) => e);

    // Then
    expect(error).toMatchObject({ status: 422, message: "Failed to decode image" });
  });

  it("throws WatermarkApiError on 403 forbidden", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    mockFetch.mockResolvedValueOnce(makeErrorResponse(403, "Forbidden"));

    // When
    const error = await removeWatermark(file).catch((e: unknown) => e);

    // Then
    expect(error).toBeInstanceOf(WatermarkApiError);
    expect(error).toMatchObject({ status: 403, message: "Forbidden" });
  });

  it("passes abort signal to fetch", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    const controller = new AbortController();
    mockFetch.mockResolvedValue(makeSuccessResponse());

    // When
    await removeWatermark(file, controller.signal);

    // Then
    const [, options] = mockFetch.mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it("propagates network errors as-is", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    const networkError = new TypeError("Failed to fetch");
    mockFetch.mockRejectedValue(networkError);

    // When / Then
    await expect(removeWatermark(file)).rejects.toThrow(networkError);
  });

  it("handles missing metadata headers with defaults", async () => {
    // Given
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });
    const response = new Response(new Blob(["png"]), {
      status: 200,
      headers: { "content-type": "image/png" },
    });
    mockFetch.mockResolvedValue(response);

    // When
    const result = await removeWatermark(file);

    // Then
    expect(result.metadata).toEqual({
      corner: "",
      confidence: 0,
      alphaGain: 0,
      source: "",
    });
  });
});
