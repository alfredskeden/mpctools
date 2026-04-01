import { renderHook, act } from "@testing-library/react";

const mockExportFullResolution = vi.fn(
  (..._args: unknown[]) => "data:image/png;base64,grayborder",
);
vi.mock("@/lib/prep-renderer", () => ({
  exportFullResolution: (...args: unknown[]) =>
    mockExportFullResolution(...args),
}));

const mockRemoveWatermark = vi.fn();
vi.mock("@/lib/watermark-api", () => ({
  removeWatermark: (...args: unknown[]) => mockRemoveWatermark(...args),
}));

const mockAnalyzeGuide = vi.fn();
vi.mock("@/lib/merger-utils", () => ({
  analyzeGuide: (...args: unknown[]) => mockAnalyzeGuide(...args),
  downloadCanvasAsBlob: vi.fn(),
}));

const mockDrawMergerScene = vi.fn();
vi.mock("@/components/merger/MergerCanvas", () => ({
  drawMergerScene: (...args: unknown[]) => mockDrawMergerScene(...args),
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const mockDownloadPsd = vi.fn();
vi.mock("@/lib/psd-export", () => ({
  downloadPsd: (...args: unknown[]) => mockDownloadPsd(...args),
}));

import {
  designReducer,
  initialDesignState,
  computeAutoPosition,
  useDesignWorkflow,
  TEXTBOX_AVAILABLE_HEIGHTS,
  CLASSIC_BORDERLESS_TEXTBOX_HEIGHTS,
  DESIGN_CANVAS_PRESETS,
  type DesignState,
} from "../use-design-workflow";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";
import { VERTICAL_PRESET_CENTERS } from "@/hooks/use-prep-workflow";
import {
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
} from "@/hooks/use-outpaint-workflow";

const mockCreateObjectURL = vi.fn(() => "blob:dewatermarked-url");
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal("URL", {
  ...globalThis.URL,
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

let rafCallback: FrameRequestCallback | null = null;
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  rafCallback = cb;
  return 1;
});
vi.stubGlobal("cancelAnimationFrame", vi.fn());

// Capture real createElement before any tests mock it
const realCreateElement = document.createElement.bind(document);

afterEach(() => {
  vi.clearAllMocks();
  rafCallback = null;
});

const makeImage = (w = 100, h = 100) => {
  const img = {
    width: w,
    height: h,
    naturalWidth: w,
    naturalHeight: h,
  } as HTMLImageElement;
  return img;
};

function mockImageAutoLoad() {
  const FakeImage = function (this: Record<string, unknown>) {
    this.width = 3520;
    this.height = 4800;
    this.naturalWidth = 3520;
    this.naturalHeight = 4800;
    this.onload = null;
    this.onerror = null;
    let _src = "";
    Object.defineProperty(this, "src", {
      set(val: string) {
        _src = val;
        const onload = this.onload as (() => void) | null;
        if (onload) onload();
      },
      get() {
        return _src;
      },
    });
  } as unknown as typeof globalThis.Image;
  vi.stubGlobal("Image", FakeImage);
}

function mockCanvasElement() {
  const mockCtx = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
    })),
  };
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockCtx),
    toDataURL: vi.fn(() => "data:image/png;base64,merged"),
  };
  vi.spyOn(document, "createElement").mockImplementation(
    (...args: Parameters<typeof document.createElement>) => {
      if (args[0] === "canvas")
        return mockCanvas as unknown as HTMLCanvasElement;
      return realCreateElement(...args);
    },
  );
  return mockCanvas;
}

describe("designReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = designReducer(initialDesignState, {
      type: "UNKNOWN",
    } as never);
    expect(result).toEqual(initialDesignState);
  });

  it("handles SELECT_CANVAS_SIZE", () => {
    // When
    const result = designReducer(initialDesignState, {
      type: "SELECT_CANVAS_SIZE",
      payload: "default",
    });

    // Then
    expect(result.stage).toBe(2);
    expect(result.canvasSize).toBe("default");
  });

  it("resets downstream state when selecting a new canvas size", () => {
    // Given
    const midState: DesignState = {
      ...initialDesignState,
      stage: 5,
      canvasSize: "default",
      textBoxSize: "normal",
      originalImage: makeImage(),
      grayBorderDataUrl: "data:old",
    };

    // When
    const result = designReducer(midState, {
      type: "SELECT_CANVAS_SIZE",
      payload: "classic-borderless",
    });

    // Then
    expect(result.stage).toBe(2);
    expect(result.canvasSize).toBe("classic-borderless");
    expect(result.textBoxSize).toBeNull();
    expect(result.originalImage).toBeNull();
  });

  it("handles SELECT_TEXT_BOX_SIZE", () => {
    // Given
    const stateWithCanvas: DesignState = {
      ...initialDesignState,
      stage: 2,
      canvasSize: "default",
    };

    // When
    const result = designReducer(stateWithCanvas, {
      type: "SELECT_TEXT_BOX_SIZE",
      payload: "tall",
    });

    // Then
    expect(result.stage).toBe(3);
    expect(result.textBoxSize).toBe("tall");
    expect(result.canvasSize).toBe("default");
  });

  it("resets downstream state when selecting a new text box size", () => {
    // Given
    const midState: DesignState = {
      ...initialDesignState,
      stage: 5,
      canvasSize: "default",
      textBoxSize: "normal",
      originalImage: makeImage(),
      grayBorderDataUrl: "data:old",
    };

    // When
    const result = designReducer(midState, {
      type: "SELECT_TEXT_BOX_SIZE",
      payload: "short",
    });

    // Then
    expect(result.stage).toBe(3);
    expect(result.textBoxSize).toBe("short");
    expect(result.canvasSize).toBe("default");
    expect(result.originalImage).toBeNull();
    expect(result.grayBorderDataUrl).toBeNull();
  });

  it("handles UPLOAD_ORIGINAL", () => {
    // Given
    const stateWithSize: DesignState = {
      ...initialDesignState,
      stage: 3,
      canvasSize: "default",
      textBoxSize: "tall",
    };
    const img = makeImage();

    // When
    const result = designReducer(stateWithSize, {
      type: "UPLOAD_ORIGINAL",
      payload: { image: img, fileName: "card.png" },
    });

    // Then
    expect(result.stage).toBe(4);
    expect(result.originalImage).toBe(img);
    expect(result.originalFileName).toBe("card.png");
    expect(result.isProcessing).toBe(true);
  });

  it("handles START_AUTO_PROCESS", () => {
    // When
    const result = designReducer(initialDesignState, {
      type: "START_AUTO_PROCESS",
    });

    // Then
    expect(result.isProcessing).toBe(true);
  });

  it("handles AUTO_PROCESS_COMPLETE", () => {
    // Given
    const processingState: DesignState = {
      ...initialDesignState,
      stage: 4,
      isProcessing: true,
    };

    // When
    const result = designReducer(processingState, {
      type: "AUTO_PROCESS_COMPLETE",
      payload: "data:image/png;base64,result",
    });

    // Then
    expect(result.stage).toBe(5);
    expect(result.isProcessing).toBe(false);
    expect(result.grayBorderDataUrl).toBe("data:image/png;base64,result");
  });

  it("handles DEWATERMARK_START", () => {
    // When
    const result = designReducer(initialDesignState, {
      type: "DEWATERMARK_START",
    });

    // Then
    expect(result.dewatermarkPhase).toBe("processing");
    expect(result.dewatermarkedImage).toBeNull();
    expect(result.dewatermarkError).toBeNull();
  });

  it("handles DEWATERMARK_COMPLETE", () => {
    // Given
    const img = makeImage();

    // When
    const result = designReducer(
      { ...initialDesignState, stage: 5, dewatermarkPhase: "processing" },
      { type: "DEWATERMARK_COMPLETE", payload: img },
    );

    // Then
    expect(result.stage).toBe(6);
    expect(result.dewatermarkPhase).toBe("done");
    expect(result.dewatermarkedImage).toBe(img);
    expect(result.mergePhase).toBe("processing");
  });

  it("handles DEWATERMARK_ERROR", () => {
    // When
    const result = designReducer(initialDesignState, {
      type: "DEWATERMARK_ERROR",
      payload: "Something went wrong",
    });

    // Then
    expect(result.dewatermarkPhase).toBe("error");
    expect(result.dewatermarkError).toBe("Something went wrong");
  });

  it("handles START_MERGE", () => {
    // When
    const result = designReducer(initialDesignState, { type: "START_MERGE" });

    // Then
    expect(result.mergePhase).toBe("processing");
  });

  it("handles MERGE_COMPLETE", () => {
    // Given
    const merging: DesignState = {
      ...initialDesignState,
      stage: 6,
      mergePhase: "processing",
    };
    const ogPosition = { x: 100, y: 200, w: 800, h: 1100 };

    // When
    const result = designReducer(merging, {
      type: "MERGE_COMPLETE",
      payload: {
        dataUrl: "data:image/png;base64,merged",
        mergeAnalysis: { ogPosition, canvasW: 3520, canvasH: 4800 },
      },
    });

    // Then
    expect(result.stage).toBe(7);
    expect(result.mergePhase).toBe("done");
    expect(result.mergedCanvasDataUrl).toBe("data:image/png;base64,merged");
    expect(result.mergeAnalysis).toEqual({
      ogPosition,
      canvasW: 3520,
      canvasH: 4800,
    });
  });

  it("handles MARK_DOWNLOADED", () => {
    // When
    const result = designReducer(initialDesignState, {
      type: "MARK_DOWNLOADED",
    });

    // Then
    expect(result.isDownloaded).toBe(true);
  });

  it("handles RESET", () => {
    // Given
    const dirty: DesignState = {
      ...initialDesignState,
      stage: 7,
      canvasSize: "default",
      textBoxSize: "tall",
      isDownloaded: true,
    };

    // When
    const result = designReducer(dirty, { type: "RESET" });

    // Then
    expect(result).toEqual(initialDesignState);
  });
});

describe("computeAutoPosition", () => {
  it("scales image height to match available vertical space for tall preset", () => {
    // Given
    const img = makeImage(5000, 7000);

    // When
    const { position, scale } = computeAutoPosition(img, "tall");

    // Then
    const expectedScale = TEXTBOX_AVAILABLE_HEIGHTS.tall / img.naturalHeight;
    expect(scale).toBeCloseTo(expectedScale, 5);

    const expectedX = Math.round(
      (CANVAS_WIDTH - img.naturalWidth * scale) / 2,
    );
    expect(position.x).toBe(expectedX);

    const pixelFromBottom = VERTICAL_PRESET_CENTERS.tall;
    const scaleX = CANVAS_WIDTH / CANVAS_WIDTH; // 1.0 for default
    const yCanvas = Math.round((CANVAS_HEIGHT - pixelFromBottom) * scaleX);
    const imgH = img.naturalHeight * scale;
    const expectedY = Math.max(
      0,
      Math.min(Math.round(yCanvas - imgH / 2), CANVAS_HEIGHT - imgH),
    );
    expect(position.y).toBe(expectedY);
  });

  it("clamps y to 0 when image is very tall", () => {
    // Given
    const img = makeImage(100, 10000);

    // When
    const { position } = computeAutoPosition(img, "short");

    // Then
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  it("clamps y to max when image is small and preset is low", () => {
    // Given
    const img = makeImage(100, 50);

    // When
    const { position, scale } = computeAutoPosition(img, "tall");

    // Then
    const maxY = CANVAS_HEIGHT - img.naturalHeight * scale;
    expect(position.y).toBeLessThanOrEqual(maxY);
  });

  it("produces correct scale for each preset", () => {
    // Given
    const img = makeImage(800, 1100);
    const presets = ["short", "medium", "normal", "tall"] as const;

    for (const preset of presets) {
      // When
      const { scale } = computeAutoPosition(img, preset);

      // Then
      const expectedScale =
        TEXTBOX_AVAILABLE_HEIGHTS[preset] / img.naturalHeight;
      expect(scale).toBeCloseTo(expectedScale, 5);
    }
  });

  it("uses classic borderless heights when canvas height matches", () => {
    // Given
    const img = makeImage(800, 1100);
    const { width, height } = DESIGN_CANVAS_PRESETS["classic-borderless"];

    // When
    const { scale } = computeAutoPosition(img, "short", width, height);

    // Then
    const expectedScale =
      CLASSIC_BORDERLESS_TEXTBOX_HEIGHTS.short / img.naturalHeight;
    expect(scale).toBeCloseTo(expectedScale, 5);
  });

  it("uses actual canvas dimensions for positioning with classic borderless", () => {
    // Given
    const img = makeImage(5000, 7000);
    const { width, height } = DESIGN_CANVAS_PRESETS["classic-borderless"];

    // When
    const { position, scale } = computeAutoPosition(img, "tall", width, height);

    // Then
    const expectedScale =
      CLASSIC_BORDERLESS_TEXTBOX_HEIGHTS.tall / img.naturalHeight;
    expect(scale).toBeCloseTo(expectedScale, 5);

    const expectedX = Math.round((width - img.naturalWidth * scale) / 2);
    expect(position.x).toBe(expectedX);

    const pixelFromBottom = VERTICAL_PRESET_CENTERS.tall;
    const scaleX = width / CANVAS_WIDTH;
    const yCanvas = Math.round((CANVAS_HEIGHT - pixelFromBottom) * scaleX);
    const imgH = img.naturalHeight * scale;
    const expectedY = Math.max(
      0,
      Math.min(Math.round(yCanvas - imgH / 2), height - imgH),
    );
    expect(position.y).toBe(expectedY);
  });
});

describe("useDesignWorkflow", () => {
  it("starts at stage 1 with null values", () => {
    // When
    const { result } = renderHook(() => useDesignWorkflow());

    // Then
    expect(result.current.state.stage).toBe(1);
    expect(result.current.state.canvasSize).toBeNull();
    expect(result.current.state.textBoxSize).toBeNull();
  });

  it("selectCanvasSize advances to stage 2", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());

    // When
    act(() => {
      result.current.selectCanvasSize("default");
    });

    // Then
    expect(result.current.state.stage).toBe(2);
    expect(result.current.state.canvasSize).toBe("default");
  });

  it("exposes handshake prompt and outpaint command", () => {
    // When
    const { result } = renderHook(() => useDesignWorkflow());

    // Then
    expect(result.current.handshakePrompt).toBe(HANDSHAKE_PROMPT);
    expect(result.current.outpaintCommand).toBe(OUTPAINT_COMMAND);
  });

  it("selectTextBoxSize advances to stage 3", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());

    act(() => {
      result.current.selectCanvasSize("default");
    });

    // When
    act(() => {
      result.current.selectTextBoxSize("medium");
    });

    // Then
    expect(result.current.state.stage).toBe(3);
    expect(result.current.state.textBoxSize).toBe("medium");
    expect(result.current.state.canvasSize).toBe("default");
  });

  it("uploadOriginal advances to stage 4 and triggers processing", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());
    const img = makeImage();

    act(() => {
      result.current.selectCanvasSize("default");
    });
    act(() => {
      result.current.selectTextBoxSize("normal");
    });

    // When
    act(() => {
      result.current.uploadOriginal(img, "card.png");
    });

    // Then
    expect(result.current.state.stage).toBe(4);
    expect(result.current.state.isProcessing).toBe(true);
  });

  it("auto-process runs via requestAnimationFrame and advances to stage 5", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());
    const img = makeImage(800, 1100);

    act(() => {
      result.current.selectCanvasSize("default");
    });
    act(() => {
      result.current.selectTextBoxSize("tall");
    });
    act(() => {
      result.current.uploadOriginal(img, "card.png");
    });

    // When
    act(() => {
      if (rafCallback) rafCallback(0);
    });

    // Then
    expect(mockExportFullResolution).toHaveBeenCalledOnce();
    expect(result.current.state.stage).toBe(5);
    expect(result.current.state.isProcessing).toBe(false);
    expect(result.current.state.grayBorderDataUrl).toBe(
      "data:image/png;base64,grayborder",
    );
  });

  it("uploadOutpaint triggers dewatermark and advances on success", async () => {
    // Given
    mockImageAutoLoad();

    mockRemoveWatermark.mockResolvedValue({
      blob: new Blob(["pixels"], { type: "image/png" }),
      metadata: {
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.0,
        source: "default",
      },
      pixelData: { pixels: new Uint8ClampedArray([]), width: 1, height: 1 },
    });

    const { result } = renderHook(() => useDesignWorkflow());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(mockRemoveWatermark).toHaveBeenCalledOnce();
    expect(result.current.state.dewatermarkPhase).toBe("done");
    expect(result.current.state.stage).toBe(6);
    expect(mockRevokeObjectURL).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });

  it("uploadOutpaint dispatches error on removeWatermark failure", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue(new Error("Decode failed"));
    const { result } = renderHook(() => useDesignWorkflow());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(result.current.state.dewatermarkPhase).toBe("error");
    expect(result.current.state.dewatermarkError).toBe("Decode failed");
  });

  it("uploadOutpaint ignores AbortError", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );
    const { result } = renderHook(() => useDesignWorkflow());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(result.current.state.dewatermarkPhase).toBe("processing");
  });

  it("uploadOutpaint handles non-Error rejection", async () => {
    // Given
    mockRemoveWatermark.mockRejectedValue("string error");
    const { result } = renderHook(() => useDesignWorkflow());
    const file = new File(["pixels"], "outpaint.png", { type: "image/png" });

    // When
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(result.current.state.dewatermarkPhase).toBe("error");
    expect(result.current.state.dewatermarkError).toBe(
      "Watermark removal failed",
    );
  });

  it("downloadResult does nothing without mergedCanvasDataUrl", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());

    // When
    act(() => {
      result.current.downloadResult("test.png");
    });

    // Then
    expect(result.current.state.isDownloaded).toBe(false);
  });

  it("exportPsd does nothing without required images", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());

    // When
    act(() => {
      result.current.exportPsd("test.psd");
    });

    // Then
    expect(mockDownloadPsd).not.toHaveBeenCalled();
  });

  it("exportPsd calls downloadPsd with correct params after full flow", async () => {
    // Given
    mockImageAutoLoad();
    mockCanvasElement();

    mockRemoveWatermark.mockResolvedValue({
      blob: new Blob(["px"], { type: "image/png" }),
      metadata: {
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.0,
        source: "default",
      },
      pixelData: { pixels: new Uint8ClampedArray([]), width: 1, height: 1 },
    });

    mockAnalyzeGuide.mockReturnValue({
      canvasW: 3520,
      canvasH: 4800,
      ogX: 100,
      ogY: 200,
    });

    const { result } = renderHook(() => useDesignWorkflow());

    act(() => { result.current.selectCanvasSize("default"); });
    act(() => { result.current.selectTextBoxSize("tall"); });
    const ogImg = makeImage(800, 1100);
    act(() => { result.current.uploadOriginal(ogImg, "card.png"); });
    act(() => { if (rafCallback) rafCallback(0); });

    const file = new File(["px"], "outpaint.png", { type: "image/png" });
    await act(async () => { result.current.uploadOutpaint(file); });

    expect(result.current.state.stage).toBe(7);
    expect(result.current.state.mergeAnalysis).not.toBeNull();

    // When
    act(() => {
      result.current.exportPsd("card-merged.psd");
    });

    // Then
    expect(mockDownloadPsd).toHaveBeenCalledWith(
      expect.objectContaining({
        featherStrength: 40,
        irregMagnitude: 100,
        irregRadius: 0,
        irregDensity: 100,
        irregSeed: 42,
        irregBlur: 12,
      }),
      "card-merged.psd",
    );

    vi.restoreAllMocks();
  });

  it("reset returns to initial state", () => {
    // Given
    const { result } = renderHook(() => useDesignWorkflow());
    act(() => {
      result.current.selectTextBoxSize("tall");
    });

    // When
    act(() => {
      result.current.reset();
    });

    // Then
    expect(result.current.state).toEqual(initialDesignState);
  });

  it("auto-process effect does not fire when conditions are not met", () => {
    // Given
    renderHook(() => useDesignWorkflow());

    // Then
    expect(mockExportFullResolution).not.toHaveBeenCalled();
  });

  it("full flow through auto-merge completes at stage 7", async () => {
    // Given
    mockImageAutoLoad();
    mockCanvasElement();

    mockRemoveWatermark.mockResolvedValue({
      blob: new Blob(["px"], { type: "image/png" }),
      metadata: {
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.0,
        source: "default",
      },
      pixelData: { pixels: new Uint8ClampedArray([]), width: 1, height: 1 },
    });

    mockAnalyzeGuide.mockReturnValue({
      canvasW: 3520,
      canvasH: 4800,
      ogX: 100,
      ogY: 200,
    });

    const { result } = renderHook(() => useDesignWorkflow());

    // Stage 1 -> 2
    act(() => {
      result.current.selectCanvasSize("default");
    });

    // Stage 2 -> 3
    act(() => {
      result.current.selectTextBoxSize("tall");
    });

    // Stage 3 -> 4
    const ogImg = makeImage(800, 1100);
    act(() => {
      result.current.uploadOriginal(ogImg, "card.png");
    });

    // Stage 4 -> 5 (auto-process via raf)
    act(() => {
      if (rafCallback) rafCallback(0);
    });
    expect(result.current.state.stage).toBe(5);

    // Stage 5 -> 6 -> 7 (dewatermark + auto-merge)
    const file = new File(["px"], "outpaint.png", { type: "image/png" });
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(result.current.state.stage).toBe(7);
    expect(result.current.state.mergePhase).toBe("done");
    expect(result.current.state.mergedCanvasDataUrl).toBe(
      "data:image/png;base64,merged",
    );
    expect(mockDrawMergerScene).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });

  it("auto-merge dispatches error when analyzeGuide returns null", async () => {
    // Given
    mockImageAutoLoad();
    mockCanvasElement();
    mockAnalyzeGuide.mockReturnValue(null);

    mockRemoveWatermark.mockResolvedValue({
      blob: new Blob(["px"], { type: "image/png" }),
      metadata: {
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.0,
        source: "default",
      },
      pixelData: { pixels: new Uint8ClampedArray([]), width: 1, height: 1 },
    });

    const { result } = renderHook(() => useDesignWorkflow());

    // Full flow to stage 6
    act(() => {
      result.current.selectCanvasSize("default");
    });
    act(() => {
      result.current.selectTextBoxSize("tall");
    });
    const ogImg = makeImage(800, 1100);
    act(() => {
      result.current.uploadOriginal(ogImg, "card.png");
    });
    act(() => {
      if (rafCallback) rafCallback(0);
    });

    const file = new File(["px"], "outpaint.png", { type: "image/png" });
    await act(async () => {
      result.current.uploadOutpaint(file);
    });

    // Then
    expect(result.current.state.dewatermarkError).toBe(
      "Could not analyze guide image",
    );

    vi.restoreAllMocks();
  });

  it("uploadOutpaint aborts previous request", async () => {
    // Given
    const abortSpy = vi.fn();
    let callCount = 0;
    mockRemoveWatermark.mockImplementation(
      (_file: File, signal?: AbortSignal) => {
        callCount++;
        if (signal) {
          signal.addEventListener("abort", abortSpy);
        }
        if (callCount === 1) {
          return new Promise(() => {}); // never resolves
        }
        return Promise.resolve({
          blob: new Blob(["px"], { type: "image/png" }),
          metadata: {
            corner: "bottom-right",
            confidence: 0.9,
            alphaGain: 1.0,
            source: "default",
          },
          pixelData: {
            pixels: new Uint8ClampedArray([]),
            width: 1,
            height: 1,
          },
        });
      },
    );

    const { result } = renderHook(() => useDesignWorkflow());

    // When - first upload
    act(() => {
      result.current.uploadOutpaint(
        new File(["a"], "first.png", { type: "image/png" }),
      );
    });

    // When - second upload should abort first
    act(() => {
      result.current.uploadOutpaint(
        new File(["b"], "second.png", { type: "image/png" }),
      );
    });

    // Then
    expect(abortSpy).toHaveBeenCalledOnce();
  });

  it("downloadResult creates and clicks a download link when data exists", async () => {
    // Given - full flow to reach stage 7
    mockImageAutoLoad();
    mockCanvasElement();

    mockRemoveWatermark.mockResolvedValue({
      blob: new Blob(["px"], { type: "image/png" }),
      metadata: {
        corner: "bottom-right",
        confidence: 0.9,
        alphaGain: 1.0,
        source: "default",
      },
      pixelData: { pixels: new Uint8ClampedArray([]), width: 1, height: 1 },
    });

    mockAnalyzeGuide.mockReturnValue({
      canvasW: 3520,
      canvasH: 4800,
      ogX: 100,
      ogY: 200,
    });

    const { result } = renderHook(() => useDesignWorkflow());
    act(() => { result.current.selectCanvasSize("default"); });
    act(() => { result.current.selectTextBoxSize("tall"); });
    act(() => { result.current.uploadOriginal(makeImage(800, 1100), "card.png"); });
    act(() => { if (rafCallback) rafCallback(0); });
    await act(async () => {
      result.current.uploadOutpaint(new File(["px"], "out.png", { type: "image/png" }));
    });
    expect(result.current.state.stage).toBe(7);

    const mockClick = vi.fn();
    const mockLink = { click: mockClick, download: "", href: "" };
    vi.spyOn(document, "createElement").mockImplementation(
      (...args: Parameters<typeof document.createElement>) => {
        if (args[0] === "a") return mockLink as unknown as HTMLAnchorElement;
        return realCreateElement(...args);
      },
    );

    // When
    act(() => {
      result.current.downloadResult("card-final.png");
    });

    // Then
    expect(mockClick).toHaveBeenCalledOnce();
    expect(result.current.state.isDownloaded).toBe(true);

    vi.restoreAllMocks();
  });

  it("reset aborts active upload when called during processing", () => {
    // Given
    let aborted = false;
    mockRemoveWatermark.mockImplementation(
      (_file: File, signal?: AbortSignal) => {
        signal?.addEventListener("abort", () => { aborted = true; });
        return new Promise(() => {}); // never resolves
      },
    );

    const { result } = renderHook(() => useDesignWorkflow());
    act(() => {
      result.current.uploadOutpaint(new File(["a"], "out.png", { type: "image/png" }));
    });

    // When
    act(() => {
      result.current.reset();
    });

    // Then
    expect(aborted).toBe(true);
    expect(result.current.state).toEqual(initialDesignState);
  });
});
