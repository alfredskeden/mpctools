import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("sharp");
vi.mock("@/lib/watermark-detection", () => ({ detectBestCandidate: vi.fn() }));
vi.mock("@/lib/watermark-removal", () => ({ runPipeline: vi.fn() }));

import sharp from "sharp";
import { detectBestCandidate } from "@/lib/watermark-detection";
import { runPipeline } from "@/lib/watermark-removal";
import { POST } from "./route";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOST = "localhost:3000";
const ORIGIN = "http://localhost:3000";
const DECODED_DATA = Buffer.alloc(4 * 10 * 10);
const DECODED_INFO = { width: 10, height: 10, channels: 4 };
const PNG_BYTES = Buffer.from([137, 80, 78, 71]);
const DEFAULT_PIPELINE_RESULT = {
  imageData: { data: new Uint8ClampedArray(4 * 10 * 10), width: 10, height: 10 },
  alphaMap: new Float32Array(100),
  alphaGain: 1.1,
  confidence: 0.87,
  accepted: true,
  detectionSource: "adaptive" as const,
  position: { x: 0, y: 0, width: 10, height: 10 },
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
    headers = { origin: ORIGIN, host: HOST },
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

// ─── Sharp helpers ────────────────────────────────────────────────────────────

function createDecodeInstance(error?: Error) {
  const inst = {
    ensureAlpha: vi.fn(),
    raw: vi.fn(),
    toBuffer: vi.fn(),
  };
  inst.ensureAlpha.mockReturnValue(inst);
  inst.raw.mockReturnValue(inst);
  if (error) {
    inst.toBuffer.mockRejectedValue(error);
  } else {
    inst.toBuffer.mockResolvedValue({ data: DECODED_DATA, info: DECODED_INFO });
  }
  return inst;
}

function createEncodeInstance(error?: Error) {
  const inst = { png: vi.fn(), toBuffer: vi.fn() };
  inst.png.mockReturnValue(inst);
  if (error) {
    inst.toBuffer.mockRejectedValue(error);
  } else {
    inst.toBuffer.mockResolvedValue(PNG_BYTES);
  }
  return inst;
}

function setupSharp({
  decodeError,
  encodeError,
}: { decodeError?: Error; encodeError?: Error } = {}) {
  vi.mocked(sharp).mockReset();
  vi.mocked(sharp)
    .mockReturnValueOnce(createDecodeInstance(decodeError) as unknown as ReturnType<typeof sharp>)
    .mockReturnValueOnce(createEncodeInstance(encodeError) as unknown as ReturnType<typeof sharp>);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/watermark-remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSharp();
    vi.mocked(detectBestCandidate).mockReturnValue(
      { corner: "bottom-right" } as ReturnType<typeof detectBestCandidate>,
    );
    vi.mocked(runPipeline).mockReturnValue(DEFAULT_PIPELINE_RESULT);
  });

  describe("access control", () => {
    it("returns 403 when origin header is missing", async () => {
      // Given
      const request = makeRequest({ headers: { host: HOST } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("returns 403 when host header is missing", async () => {
      // Given
      const request = makeRequest({ headers: { origin: ORIGIN } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("returns 403 when origin does not include host", async () => {
      // Given
      const request = makeRequest({ headers: { origin: "http://evil.com", host: HOST } });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(403);
    });

    it("allows same-origin requests", async () => {
      // Given
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
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

    it("returns 422 when sharp cannot decode the image", async () => {
      // Given
      setupSharp({ decodeError: new Error("unsupported format") });
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(422);
    });
  });

  describe("processing", () => {
    it("skips detectBestCandidate by default (adaptive=false)", async () => {
      // Given
      const request = makeRequest();

      // When
      await POST(request);

      // Then
      expect(detectBestCandidate).not.toHaveBeenCalled();
      expect(runPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        null,
      );
    });

    it("calls detectBestCandidate when adaptive=true", async () => {
      // Given
      const request = makeRequest({ fields: { adaptive: "true" } });

      // When
      await POST(request);

      // Then
      expect(detectBestCandidate).toHaveBeenCalledOnce();
    });

    it("passes forcedVariant and corner to detectBestCandidate", async () => {
      // Given
      const request = makeRequest({
        fields: { adaptive: "true", forcedVariant: "96", corner: "bottom-right" },
      });

      // When
      await POST(request);

      // Then
      expect(detectBestCandidate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ forcedVariant: "96", corner: "bottom-right" }),
      );
    });

    it("uses worker-matching defaults (postLightness=2.75, maskExpand=1.5, feather=4)", async () => {
      // Given
      const request = makeRequest();

      // When
      await POST(request);

      // Then
      expect(runPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ postLightness: 2.75, maskExpand: 1.5, feather: 4 }),
        null,
      );
    });

    it("passes all explicit settings to runPipeline", async () => {
      // Given
      const request = makeRequest({
        fields: {
          alphaGain: "1.2",
          feather: "6",
          postLightness: "3.0",
          edgeReveal: "0.8",
          innerPunch: "1.1",
          maskExpand: "2.0",
          corner: "top-left",
        },
      });

      // When
      await POST(request);

      // Then
      expect(runPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          alphaGain: 1.2,
          feather: 6,
          postLightness: 3.0,
          edgeReveal: 0.8,
          innerPunch: 1.1,
          maskExpand: 2.0,
          corner: "top-left",
        }),
        null,
      );
    });

    it("ignores non-numeric float fields and omits them from settings", async () => {
      // Given
      const request = makeRequest({ fields: { alphaGain: "not-a-number" } });

      // When
      await POST(request);

      // Then
      const settings = vi.mocked(runPipeline).mock.calls[0][1];
      expect((settings as Record<string, unknown>).alphaGain).toBeUndefined();
    });

    it("returns 500 when sharp encoding fails", async () => {
      // Given
      setupSharp({ encodeError: new Error("encode error") });
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
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

    it("populates corner header when detection was accepted", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: true });
      vi.mocked(detectBestCandidate).mockReturnValue(
        { corner: "bottom-right" } as ReturnType<typeof detectBestCandidate>,
      );
      const request = makeRequest({ fields: { adaptive: "true" } });

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-corner")).toBe("bottom-right");
    });

    it("leaves corner header empty when result was not accepted", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: false });
      const request = makeRequest();

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-corner")).toBe("");
    });

    it("leaves corner header empty when no detection ran (adaptive=false)", async () => {
      // Given
      vi.mocked(runPipeline).mockReturnValue({ ...DEFAULT_PIPELINE_RESULT, accepted: true });
      const request = makeRequest({ fields: { adaptive: "false" } });

      // When
      const response = await POST(request);

      // Then
      expect(response.headers.get("x-detection-corner")).toBe("");
    });
  });
});
