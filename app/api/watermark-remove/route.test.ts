import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockToBuffer = vi.fn();
const mockRaw = vi.fn();
const mockEnsureAlpha = vi.fn();
const mockPng = vi.fn();
const mockSharpInstance = {
  ensureAlpha: mockEnsureAlpha,
  raw: mockRaw,
  png: mockPng,
  toBuffer: mockToBuffer,
};
const mockSharp = vi.fn(() => mockSharpInstance);

vi.mock("sharp", () => ({ default: mockSharp }));

const mockDetectBestCandidate = vi.fn();
vi.mock("@/lib/watermark-detection", () => ({
  detectBestCandidate: mockDetectBestCandidate,
}));

const mockRunPipeline = vi.fn();
vi.mock("@/lib/watermark-removal", () => ({
  runPipeline: mockRunPipeline,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

const { POST } = await import("./route");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  formData: FormData | null,
  headers: Record<string, string> = {},
): Request {
  const mockHeaders = new Headers({
    origin: "http://localhost",
    host: "localhost",
    ...headers,
  });
  const formDataFn =
    formData !== null
      ? vi.fn().mockResolvedValue(formData)
      : vi.fn().mockRejectedValue(new Error("bad body"));
  return {
    headers: mockHeaders,
    formData: formDataFn,
  } as unknown as Request;
}

function makeImageBlob(): Blob {
  return new Blob([new Uint8Array(4)], { type: "image/png" });
}

function makeDefaultFormData(): FormData {
  const fd = new FormData();
  fd.append("image", makeImageBlob(), "test.png");
  return fd;
}

function makeRawImageData(width = 4, height = 4) {
  return {
    data: new Uint8ClampedArray(width * height * 4).fill(128),
    width,
    height,
  };
}

/** Sets up sharp chain mocks for a full successful decode + encode cycle. */
function setupSharpSuccess(width = 4, height = 4) {
  mockEnsureAlpha.mockReturnValue(mockSharpInstance);
  mockRaw.mockReturnValue(mockSharpInstance);
  mockPng.mockReturnValue(mockSharpInstance);

  const rawBuf = Buffer.alloc(width * height * 4, 128);
  // First call = decode (returns {data, info})
  mockToBuffer.mockResolvedValueOnce({
    data: rawBuf,
    info: { width, height, channels: 4 },
  });
  // Second call = encode (returns PNG buffer)
  mockToBuffer.mockResolvedValueOnce(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
}

function setupPipelineSuccess(width = 4, height = 4) {
  mockRunPipeline.mockReturnValue({
    imageData: makeRawImageData(width, height),
    position: { x: 0, y: 0, width: 4, height: 4 },
    alphaMap: new Float32Array(16),
    alphaGain: 1.0,
    confidence: 0.85,
    accepted: true,
    detectionSource: "adaptive",
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/watermark-remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSharp.mockReturnValue(mockSharpInstance);
  });

  describe("access control", () => {
    it("returns 403 when origin header is missing", async () => {
      // Given
      const fd = makeDefaultFormData();
      const req = makeRequest(fd, { origin: "", host: "localhost" });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 403 when host header is missing", async () => {
      // Given
      const fd = makeDefaultFormData();
      const req = makeRequest(fd, { origin: "http://localhost", host: "" });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(403);
    });

    it("returns 403 when origin does not include host", async () => {
      // Given
      const fd = makeDefaultFormData();
      const req = makeRequest(fd, {
        origin: "http://evil.example.com",
        host: "localhost",
      });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(403);
    });

    it("allows requests where origin includes host", async () => {
      // Given: same-origin request
      const fd = makeDefaultFormData();
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd, {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).not.toBe(403);
    });
  });

  describe("input validation", () => {
    it("returns 400 when request body cannot be parsed as form data", async () => {
      // Given: formData() rejects
      const req = makeRequest(null);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 400 when image field is missing", async () => {
      // Given
      const fd = new FormData();
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 400 when image field is a string not a blob", async () => {
      // Given
      const fd = new FormData();
      fd.append("image", "not-a-blob");
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
    });

    it("returns 400 when image blob cannot be read", async () => {
      // Given: arrayBuffer() throws for all Blobs
      const spy = vi
        .spyOn(Blob.prototype, "arrayBuffer")
        .mockRejectedValue(new Error("read error"));
      const fd = makeDefaultFormData();
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
      spy.mockRestore();
    });

    it("returns 422 when sharp cannot decode the image", async () => {
      // Given: decode step throws
      const fd = makeDefaultFormData();
      mockEnsureAlpha.mockReturnValue(mockSharpInstance);
      mockRaw.mockReturnValue(mockSharpInstance);
      mockToBuffer.mockRejectedValueOnce(new Error("unsupported format"));
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(422);
    });
  });

  describe("successful processing", () => {
    it("returns 200 with Content-Type image/png on success", async () => {
      // Given
      const fd = makeDefaultFormData();
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
    });

    it("includes detection metadata headers on success", async () => {
      // Given
      const fd = makeDefaultFormData();
      setupSharpSuccess();
      mockRunPipeline.mockReturnValue({
        imageData: makeRawImageData(),
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1.2,
        confidence: 0.9,
        accepted: true,
        detectionSource: "adaptive",
      });
      mockDetectBestCandidate.mockReturnValue({
        accepted: true,
        corner: "bottom-right",
        confidence: 0.9,
      });
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.headers.get("x-detection-confidence")).toBe("0.9");
      expect(res.headers.get("x-detection-alpha-gain")).toBe("1.2");
      expect(res.headers.get("x-detection-source")).toBe("adaptive");
    });

    it("returns 500 when sharp PNG encoding fails", async () => {
      // Given: decode succeeds, encode throws
      const fd = makeDefaultFormData();
      mockEnsureAlpha.mockReturnValue(mockSharpInstance);
      mockRaw.mockReturnValue(mockSharpInstance);
      mockPng.mockReturnValue(mockSharpInstance);
      const rawBuf = Buffer.alloc(16 * 4, 128);
      mockToBuffer.mockResolvedValueOnce({
        data: rawBuf,
        info: { width: 4, height: 4, channels: 4 },
      });
      mockToBuffer.mockRejectedValueOnce(new Error("encode failed"));
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(500);
    });
  });

  describe("variant and corner params", () => {
    it("runs adaptive detection when variant is auto", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("variant", "auto");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue({ accepted: false });
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockDetectBestCandidate).toHaveBeenCalledOnce();
    });

    it("runs adaptive detection when corner is auto", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("corner", "auto");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue({ accepted: false });
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockDetectBestCandidate).toHaveBeenCalledOnce();
    });

    it("skips adaptive detection when variant and corner are explicit", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("variant", "96");
      fd.append("corner", "bottom-right");
      setupSharpSuccess();
      setupPipelineSuccess();
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockDetectBestCandidate).not.toHaveBeenCalled();
    });

    it("passes forcedVariant to detectBestCandidate when variant is specific and corner is auto", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("variant", "96");
      fd.append("corner", "auto");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue({ accepted: false });
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockDetectBestCandidate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ forcedVariant: "96" }),
      );
    });
  });

  describe("optional params", () => {
    it("passes alphaGain and feather to runPipeline", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("alphaGain", "1.3");
      fd.append("feather", "6");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockRunPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ alphaGain: 1.3, feather: 6 }),
        null,
      );
    });

    it("passes lightness to runPipeline as postLightness", async () => {
      // Given
      const fd = makeDefaultFormData();
      fd.append("lightness", "10");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockRunPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ postLightness: 10 }),
        null,
      );
    });

    it("falls back to defaults when params are non-numeric strings", async () => {
      // Given: params that parse to NaN
      const fd = makeDefaultFormData();
      fd.append("alphaGain", "abc");
      fd.append("feather", "xyz");
      fd.append("lightness", "bad");
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then: NaN values fall back to defaults
      expect(mockRunPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ alphaGain: 1, feather: 4, postLightness: 0 }),
        null,
      );
    });

    it("uses defaults when optional params are absent", async () => {
      // Given
      const fd = makeDefaultFormData();
      setupSharpSuccess();
      setupPipelineSuccess();
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      await POST(req);

      // Then
      expect(mockRunPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ alphaGain: 1.0, feather: 4, postLightness: 0 }),
        null,
      );
    });
  });

  describe("detection header when not accepted", () => {
    it("sets empty corner header when result is not accepted", async () => {
      // Given
      const fd = makeDefaultFormData();
      setupSharpSuccess();
      mockRunPipeline.mockReturnValue({
        imageData: makeRawImageData(),
        position: { x: 0, y: 0, width: 4, height: 4 },
        alphaMap: new Float32Array(16),
        alphaGain: 1.0,
        confidence: 0.74,
        accepted: false,
        detectionSource: "preset",
      });
      mockDetectBestCandidate.mockReturnValue(null);
      const req = makeRequest(fd);

      // When
      const res = await POST(req);

      // Then
      expect(res.headers.get("x-detection-corner")).toBe("");
    });
  });
});
