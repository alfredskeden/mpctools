import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/watermark-pipeline", () => ({ runWatermarkPipeline: vi.fn() }));

import { runWatermarkPipeline } from "@/lib/watermark-pipeline";
import { POST } from "./route";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOST = "localhost:3000";
const ORIGIN = "http://localhost:3000";
const SECRET = "test-secret-abc123";
const PNG_BYTES = new Uint8Array([137, 80, 78, 71]);
const DEFAULT_PIPELINE_OUTPUT = {
  pngBytes: PNG_BYTES,
  corner: "bottom-right",
  confidence: 0.87,
  alphaGain: 1.1,
  source: "adaptive" as const,
  accepted: true,
};

// ─── Request helpers ──────────────────────────────────────────────────────────

type ImageField =
  | { kind: "ok"; arrayBufferError?: Error }
  | { kind: "missing" }
  | { kind: "string" };

type RequestOpts = {
  headers?: Record<string, string>;
  formDataError?: Error;
  image?: ImageField;
  fields?: Record<string, string>;
};

function makeMockBlob(error?: Error): { arrayBuffer: () => Promise<ArrayBuffer> } {
  return {
    arrayBuffer: () =>
      error ? Promise.reject(error) : Promise.resolve(new ArrayBuffer(4)),
  };
}

function makeRequest(opts: RequestOpts = {}): Request {
  const {
    headers = { origin: ORIGIN, host: HOST, authorization: `Bearer ${SECRET}` },
    formDataError,
    image = { kind: "ok" },
    fields = {},
  } = opts;

  let imageField: unknown;
  if (image.kind === "missing") {
    imageField = null;
  } else if (image.kind === "string") {
    imageField = "not-a-blob";
  } else {
    imageField = makeMockBlob(image.arrayBufferError);
  }

  const mockRequest = {
    headers: new Headers(headers),
    formData: formDataError
      ? () => Promise.reject(formDataError)
      : () =>
          Promise.resolve({
            get: (name: string) => {
              if (name === "image") return imageField;
              return fields[name] ?? null;
            },
          } as unknown as FormData),
  };

  return mockRequest as unknown as Request;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/watermark-remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("WATERMARK_API_SECRET", SECRET);
    vi.mocked(runWatermarkPipeline).mockResolvedValue(DEFAULT_PIPELINE_OUTPUT);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("access control", () => {
    it("returns 403 when WATERMARK_API_SECRET is not set", async () => {
      // Given
      vi.unstubAllEnvs();
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("returns 403 when authorization header is missing", async () => {
      // Given
      const request = makeRequest({ headers: { origin: ORIGIN, host: HOST } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("returns 403 when token is wrong", async () => {
      // Given
      const request = makeRequest({
        headers: { origin: ORIGIN, host: HOST, authorization: "Bearer wrong-token" },
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("allows request with valid Bearer token", async () => {
      // Given
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
    });

    it("returns 403 for same-origin request without secret", async () => {
      // Given
      vi.unstubAllEnvs();
      const request = makeRequest({ headers: { origin: ORIGIN, host: HOST } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });
  });

  describe("input validation", () => {
    it("returns 400 when formData parsing fails", async () => {
      // Given
      const request = makeRequest({ formDataError: new Error("parse error") });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
    });

    it("returns 400 when image field is missing", async () => {
      // Given
      const request = makeRequest({ image: { kind: "missing" } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
    });

    it("returns 400 when image field is a string instead of a blob", async () => {
      // Given
      const request = makeRequest({ image: { kind: "string" } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
    });

    it("returns 400 when reading image blob fails", async () => {
      // Given
      const request = makeRequest({
        image: { kind: "ok", arrayBufferError: new Error("read error") },
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
    });

    it("returns 422 when pipeline throws a decode error", async () => {
      // Given
      vi.mocked(runWatermarkPipeline).mockRejectedValue(new Error("Input unsupported format"));
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(422);
    });

    it("returns 500 when pipeline throws a non-decode error", async () => {
      // Given
      vi.mocked(runWatermarkPipeline).mockRejectedValue(new Error("encode error"));
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
    });

    it("returns 500 when pipeline throws a non-Error value", async () => {
      // Given
      vi.mocked(runWatermarkPipeline).mockRejectedValue("string error");
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
    });
  });

  describe("processing", () => {
    it("skips adaptive detection by default (adaptive=false)", async () => {
      // Given
      const request = makeRequest();

      // When
      await POST(request);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adaptive: false }),
      );
    });

    it("passes adaptive=true when specified", async () => {
      // Given
      const request = makeRequest({ fields: { adaptive: "true" } });

      // When
      await POST(request);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adaptive: true }),
      );
    });

    it("passes forcedVariant and corner to the pipeline", async () => {
      // Given
      const request = makeRequest({
        fields: { adaptive: "true", forcedVariant: "96", corner: "bottom-right" },
      });

      // When
      await POST(request);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ forcedVariant: "96", corner: "bottom-right" }),
      );
    });

    it("passes all explicit float settings to the pipeline", async () => {
      // Given
      const request = makeRequest({
        fields: {
          alphaGain: "1.2",
          feather: "6",
          postLightness: "3.0",
          edgeReveal: "0.8",
          innerPunch: "1.1",
          maskExpand: "2.0",
        },
      });

      // When
      await POST(request);

      // Then
      expect(runWatermarkPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          alphaGain: 1.2,
          feather: 6,
          postLightness: 3.0,
          edgeReveal: 0.8,
          innerPunch: 1.1,
          maskExpand: 2.0,
        }),
      );
    });

    it("omits non-numeric float fields from pipeline options", async () => {
      // Given
      const request = makeRequest({ fields: { alphaGain: "not-a-number" } });

      // When
      await POST(request);

      // Then
      const options = vi.mocked(runWatermarkPipeline).mock.calls[0][1] as Record<string, unknown>;
      expect(options.alphaGain).toBeUndefined();
    });
  });

  describe("response", () => {
    it("returns PNG content-type on success", async () => {
      // Given
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("content-type")).toBe("image/png");
    });

    it("includes detection metadata headers", async () => {
      // Given
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-confidence")).toBe("0.87");
      expect(response.headers.get("x-detection-alpha-gain")).toBe("1.1");
      expect(response.headers.get("x-detection-source")).toBe("adaptive");
      expect(response.headers.get("x-detection-accepted")).toBe("true");
    });

    it("includes corner header from pipeline output", async () => {
      // Given
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-corner")).toBe("bottom-right");
    });

    it("returns empty corner header when pipeline output has empty corner", async () => {
      // Given
      vi.mocked(runWatermarkPipeline).mockResolvedValue({ ...DEFAULT_PIPELINE_OUTPUT, corner: "" });
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-corner")).toBe("");
    });
  });
});
