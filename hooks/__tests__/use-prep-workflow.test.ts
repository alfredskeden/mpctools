import { renderHook, act } from "@testing-library/react";
import {
  prepReducer,
  getStepStatuses,
  usePrepWorkflow,
  OVERLAY_OPTIONS,
  VERTICAL_PRESET_CENTERS,
  CANVAS_SIZE_PRESETS,
  PREP_CANVAS_SIZE_KEY,
  type PrepState,
} from "../use-prep-workflow";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_CANVAS_STEP,
  MAX_CANVAS_STEP,
  canvasSizeForStep,
} from "@/lib/canvas-utils";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const makeImage = () => ({ width: 100, height: 100 }) as HTMLImageElement;

const initialState: PrepState = {
  currentStep: 1,
  uploadedImage: null,
  imageElement: null,
  fileName: null,
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  isPositioned: false,
  isDownloaded: false,
  selectedOverlays: [],
  canvasDataUrl: null,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  dpiOverride: null,
  overlayOpacities: {},
  keepAspectRatio: true,
  algorithm: "detail-preserving",
  overlayNativeDimensions: null,
  canvasSizingMode: "scale-image",
};

const nativeState: PrepState = {
  ...initialState,
  canvasSizingMode: "native-image",
};

describe("prepReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = prepReducer(initialState, { type: "UNKNOWN" } as never);
    expect(result).toEqual(initialState);
  });

  it("handles UPLOAD_IMAGE", () => {
    const element = makeImage();
    const result = prepReducer(initialState, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:image/png;base64,abc",
        element,
        fileName: "card.png",
      },
    });

    expect(result.currentStep).toBe(2);
    expect(result.uploadedImage).toBe("data:image/png;base64,abc");
    expect(result.imageElement).toBe(element);
    expect(result.fileName).toBe("card.png");
    expect(result.isPositioned).toBe(false);
    expect(result.isDownloaded).toBe(false);
  });

  it("resets position and scale on new upload", () => {
    const state: PrepState = {
      ...initialState,
      currentStep: 3,
      position: { x: 50, y: 50 },
      scale: 2,
      isPositioned: true,
    };

    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:new",
        element: makeImage(),
        fileName: "new.png",
      },
    });

    // 100x100 image fits at scale 1, centered: (3520-100)/2=1710, (4800-100)/2=2350
    expect(result.scale).toBe(1);
    expect(result.position).toEqual({ x: 1710, y: 2350 });
    expect(result.isPositioned).toBe(false);
    expect(result.rotation).toBe(0);
  });

  it("auto-scales a large image to fit the canvas with padding", () => {
    const largeImage = { width: 4000, height: 3000 } as HTMLImageElement;
    const result = prepReducer(initialState, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:large",
        element: largeImage,
        fileName: "large.png",
      },
    });

    expect(result.scale).toBe((3520 * 0.8) / 4000);
  });

  it("handles UPDATE_POSITION", () => {
    const result = prepReducer(initialState, {
      type: "UPDATE_POSITION",
      payload: { x: 10, y: 20 },
    });

    expect(result.position).toEqual({ x: 10, y: 20 });
  });

  it("handles UPDATE_SCALE with no image as scale-only update", () => {
    const result = prepReducer(initialState, {
      type: "UPDATE_SCALE",
      payload: 1.5,
    });

    expect(result.scale).toBe(1.5);
    expect(result.position).toEqual({ x: 0, y: 0 });
  });

  it("handles UPDATE_SCALE with image by scaling about the image center", () => {
    // image: 100x100, scale: 1, position: (50, 50)
    // center: (50 + 50, 50 + 50) = (100, 100)
    // new scale: 2 → new size: 200x200
    // new position: (100 - 100, 100 - 100) = (0, 0)
    const image = { width: 100, height: 100 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image, scale: 1, position: { x: 50, y: 50 } };
    const result = prepReducer(state, { type: "UPDATE_SCALE", payload: 2 });

    expect(result.scale).toBe(2);
    expect(result.position).toEqual({ x: 0, y: 0 });
  });

  it("handles UPDATE_ROTATION", () => {
    const result = prepReducer(initialState, {
      type: "UPDATE_ROTATION",
      payload: 90,
    });

    expect(result.rotation).toBe(90);
  });

  it("handles MARK_POSITIONED", () => {
    const state: PrepState = { ...initialState, currentStep: 2 };
    const result = prepReducer(state, { type: "MARK_POSITIONED" });

    expect(result.currentStep).toBe(3);
    expect(result.isPositioned).toBe(true);
  });

  it("handles MARK_DOWNLOADED", () => {
    const state: PrepState = {
      ...initialState,
      currentStep: 3,
      isPositioned: true,
    };
    const result = prepReducer(state, { type: "MARK_DOWNLOADED" });

    expect(result.isDownloaded).toBe(true);
  });

  it("handles TOGGLE_OVERLAY to add an overlay", () => {
    const result = prepReducer(initialState, {
      type: "TOGGLE_OVERLAY",
      payload: "normal",
    });

    expect(result.selectedOverlays).toEqual(["normal"]);
    expect(result.overlayOpacities.normal).toBe(100);
  });

  it("handles TOGGLE_OVERLAY to remove an overlay", () => {
    const state: PrepState = { ...initialState, selectedOverlays: ["normal", "short"] };
    const result = prepReducer(state, {
      type: "TOGGLE_OVERLAY",
      payload: "normal",
    });

    expect(result.selectedOverlays).toEqual(["short"]);
  });

  it("preserves existing opacity when toggling overlay back on", () => {
    const state: PrepState = {
      ...initialState,
      selectedOverlays: [],
      overlayOpacities: { normal: 75 },
    };
    const result = prepReducer(state, {
      type: "TOGGLE_OVERLAY",
      payload: "normal",
    });

    expect(result.overlayOpacities.normal).toBe(75);
  });

  it("sets selectedOverlays to tall_normal and black_bottom on UPLOAD_IMAGE", () => {
    const state: PrepState = { ...initialState, selectedOverlays: ["normal"] };
    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:new",
        element: makeImage(),
        fileName: "new.png",
      },
    });

    expect(result.selectedOverlays).toEqual(["tall_normal", "black_bottom"]);
  });

  it("initializes overlayOpacities to 100 for default overlays on UPLOAD_IMAGE", () => {
    const result = prepReducer(initialState, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:new",
        element: makeImage(),
        fileName: "new.png",
      },
    });

    expect(result.overlayOpacities).toEqual({
      tall_normal: 100,
      black_bottom: 100,
    });
  });

  it("uses current canvasWidth/canvasHeight for initial scale on UPLOAD_IMAGE", () => {
    const state: PrepState = {
      ...initialState,
      canvasWidth: 2048,
      canvasHeight: 2048,
    };
    const largeImage = { width: 4000, height: 3000 } as HTMLImageElement;
    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:large",
        element: largeImage,
        fileName: "large.png",
      },
    });

    expect(result.scale).toBe((2048 * 0.8) / 4000);
  });

  it("handles SET_CANVAS_DATA_URL", () => {
    const result = prepReducer(initialState, {
      type: "SET_CANVAS_DATA_URL",
      payload: "data:image/png;base64,xyz",
    });

    expect(result.canvasDataUrl).toBe("data:image/png;base64,xyz");
  });

  it("handles REPOSITION by going back to step 2 while keeping the image", () => {
    const state: PrepState = {
      currentStep: 3,
      uploadedImage: "data:test",
      imageElement: makeImage(),
      fileName: "test.png",
      position: { x: 50, y: 50 },
      scale: 2,
      rotation: 45,
      isPositioned: true,
      isDownloaded: true,
      canvasDataUrl: "data:image/png;base64,xyz",
      selectedOverlays: ["normal"],
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      dpiOverride: null,
      overlayOpacities: { normal: 80 },
      keepAspectRatio: true,
      algorithm: "detail-preserving",
      overlayNativeDimensions: null,
      canvasSizingMode: "scale-image",
    };

    const result = prepReducer(state, { type: "REPOSITION" });

    expect(result.currentStep).toBe(2);
    expect(result.isPositioned).toBe(false);
    expect(result.isDownloaded).toBe(false);
    expect(result.canvasDataUrl).toBe("data:image/png;base64,xyz");
    expect(result.uploadedImage).toBe("data:test");
    expect(result.imageElement).toBe(state.imageElement);
    expect(result.fileName).toBe("test.png");
    expect(result.position).toEqual({ x: 50, y: 50 });
    expect(result.scale).toBe(2);
    expect(result.rotation).toBe(45);
    expect(result.selectedOverlays).toEqual(["normal"]);
  });

  it("handles RESET", () => {
    const state: PrepState = {
      currentStep: 3,
      uploadedImage: "data:test",
      imageElement: makeImage(),
      fileName: "test.png",
      position: { x: 50, y: 50 },
      scale: 2,
      rotation: 45,
      isPositioned: true,
      isDownloaded: true,
      canvasDataUrl: null,
      selectedOverlays: ["normal"],
      canvasWidth: 2048,
      canvasHeight: 2048,
      dpiOverride: 300,
      overlayOpacities: { normal: 80 },
      keepAspectRatio: false,
      algorithm: "standard",
      overlayNativeDimensions: { width: 3072, height: 4096 },
      canvasSizingMode: "scale-image",
    };

    const result = prepReducer(state, { type: "RESET" });
    expect(result).toEqual(initialState);
  });

  it("handles SET_CANVAS_SIZE", () => {
    const result = prepReducer(initialState, {
      type: "SET_CANVAS_SIZE",
      payload: { width: 2048, height: 2048 },
    });

    expect(result.canvasWidth).toBe(2048);
    expect(result.canvasHeight).toBe(2048);
  });

  it("handles SET_DPI_OVERRIDE with a number", () => {
    const result = prepReducer(initialState, {
      type: "SET_DPI_OVERRIDE",
      payload: 300,
    });

    expect(result.dpiOverride).toBe(300);
  });

  it("handles SET_DPI_OVERRIDE with null", () => {
    const state: PrepState = { ...initialState, dpiOverride: 300 };
    const result = prepReducer(state, {
      type: "SET_DPI_OVERRIDE",
      payload: null,
    });

    expect(result.dpiOverride).toBeNull();
  });

  it("handles SET_DPI_OVERRIDE with a number and an image — applies scale and preserves center", () => {
    // Image is 100x100, currently at scale 1, position (0, 0)
    // Center = (50, 50). newScale = 1200/300 = 4. newW = 400, newH = 400.
    // newX = round(50 - 200) = -150, newY = round(50 - 200) = -150
    const image = makeImage(); // 100x100
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 1,
      position: { x: 0, y: 0 },
    };

    const result = prepReducer(state, {
      type: "SET_DPI_OVERRIDE",
      payload: 300,
    });

    expect(result.dpiOverride).toBe(300);
    expect(result.scale).toBe(4);
    expect(result.position).toEqual({ x: -150, y: -150 });
  });

  it("handles SET_DPI_OVERRIDE with null and an image — clears dpiOverride without changing scale or position", () => {
    const image = makeImage();
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 4,
      position: { x: -150, y: -150 },
      dpiOverride: 300,
    };

    const result = prepReducer(state, {
      type: "SET_DPI_OVERRIDE",
      payload: null,
    });

    expect(result.dpiOverride).toBeNull();
    expect(result.scale).toBe(4);
    expect(result.position).toEqual({ x: -150, y: -150 });
  });

  it("handles SET_OVERLAY_OPACITY", () => {
    const result = prepReducer(initialState, {
      type: "SET_OVERLAY_OPACITY",
      payload: { id: "normal", opacity: 50 },
    });

    expect(result.overlayOpacities.normal).toBe(50);
  });

  it("handles SET_KEEP_ASPECT_RATIO", () => {
    const result = prepReducer(initialState, {
      type: "SET_KEEP_ASPECT_RATIO",
      payload: false,
    });

    expect(result.keepAspectRatio).toBe(false);
  });

  it("handles SET_ALGORITHM", () => {
    const result = prepReducer(initialState, {
      type: "SET_ALGORITHM",
      payload: "standard",
    });

    expect(result.algorithm).toBe("standard");
  });

  it("handles SET_IMAGE_DIMENSIONS by computing scale from width and adjusting position about image center", () => {
    // image: 200x300, scale: 1, position: (0, 0)
    // center: (0 + 100, 0 + 150) = (100, 150)
    // new scale: 2 → new size: 400x600
    // new position: (100 - 200, 150 - 300) = (-100, -150)
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image, scale: 1 };
    const result = prepReducer(state, {
      type: "SET_IMAGE_DIMENSIONS",
      payload: { width: 400, height: 600 },
    });

    expect(result.scale).toBe(2);
    expect(result.position).toEqual({ x: -100, y: -150 });
  });

  it("handles SET_IMAGE_DIMENSIONS with no image as no-op", () => {
    const result = prepReducer(initialState, {
      type: "SET_IMAGE_DIMENSIONS",
      payload: { width: 400, height: 600 },
    });

    expect(result.scale).toBe(1);
  });

  it("handles CENTER_HORIZONTAL", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image, scale: 2, position: { x: 50, y: 100 } };
    const result = prepReducer(state, { type: "CENTER_HORIZONTAL" });

    // x = (3520 - 200*2) / 2 = (3520-400)/2 = 1560
    expect(result.position).toEqual({ x: 1560, y: 100 });
  });

  it("handles CENTER_HORIZONTAL with no image as no-op", () => {
    const state: PrepState = { ...initialState, position: { x: 50, y: 100 } };
    const result = prepReducer(state, { type: "CENTER_HORIZONTAL" });

    expect(result.position).toEqual({ x: 50, y: 100 });
  });

  it("handles CENTER_VERTICAL", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image, scale: 2, position: { x: 50, y: 100 } };
    const result = prepReducer(state, { type: "CENTER_VERTICAL" });

    // y = (4800 - 300*2) / 2 = (4800-600)/2 = 2100
    expect(result.position).toEqual({ x: 50, y: 2100 });
  });

  it("handles CENTER_VERTICAL with no image as no-op", () => {
    const state: PrepState = { ...initialState, position: { x: 50, y: 100 } };
    const result = prepReducer(state, { type: "CENTER_VERTICAL" });

    expect(result.position).toEqual({ x: 50, y: 100 });
  });

  it("handles FIT_WIDTH by scaling image to canvas width and centering", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image };
    const result = prepReducer(state, { type: "FIT_WIDTH" });

    const fitScale = CANVAS_WIDTH / 200;
    expect(result.scale).toBe(fitScale);
    expect(result.position.x).toBe(0);
    expect(result.position.y).toBe((CANVAS_HEIGHT - 300 * fitScale) / 2);
  });

  it("handles FIT_WIDTH with no image as no-op", () => {
    const result = prepReducer(initialState, { type: "FIT_WIDTH" });
    expect(result.scale).toBe(1);
  });

  it("handles FIT_HEIGHT by scaling image to canvas height and centering", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = { ...initialState, imageElement: image };
    const result = prepReducer(state, { type: "FIT_HEIGHT" });

    const fitScale = CANVAS_HEIGHT / 300;
    expect(result.scale).toBe(fitScale);
    expect(result.position.x).toBe((CANVAS_WIDTH - 200 * fitScale) / 2);
    expect(result.position.y).toBe(0);
  });

  it("handles FIT_HEIGHT with no image as no-op", () => {
    const result = prepReducer(initialState, { type: "FIT_HEIGHT" });
    expect(result.scale).toBe(1);
  });

  it("handles SET_VERTICAL_PRESET computing Y scaled by canvas width ratio", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 2,
    };
    const result = prepReducer(state, {
      type: "SET_VERTICAL_PRESET",
      payload: "short",
    });

    // scaleX = canvasWidth / CANVAS_WIDTH = 3520/3520 = 1.0
    // yCanvas = round((4800 - 2836) * 1.0) = 1964
    // imgH = 300 * 2 = 600, newY = round(1964 - 300) = 1664
    const scaleX = CANVAS_WIDTH / CANVAS_WIDTH;
    const yCanvas = Math.round((CANVAS_HEIGHT - VERTICAL_PRESET_CENTERS.short) * scaleX);
    const imgH = 300 * 2;
    const expectedY = Math.round(yCanvas - imgH / 2);
    expect(result.position.y).toBe(expectedY);
  });

  it("handles SET_VERTICAL_PRESET preserving x position", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 2,
      position: { x: 50, y: 0 },
    };
    const result = prepReducer(state, {
      type: "SET_VERTICAL_PRESET",
      payload: "tall",
    });

    expect(result.position.x).toBe(50);
    const scaleX = CANVAS_WIDTH / CANVAS_WIDTH;
    const yCanvas = Math.round((CANVAS_HEIGHT - VERTICAL_PRESET_CENTERS.tall) * scaleX);
    const imgH = 300 * 2;
    const expectedY = Math.round(yCanvas - imgH / 2);
    expect(result.position.y).toBe(expectedY);
  });

  it("handles SET_VERTICAL_PRESET with no image as no-op", () => {
    const result = prepReducer(initialState, {
      type: "SET_VERTICAL_PRESET",
      payload: "short",
    });

    expect(result.position).toEqual(initialState.position);
  });

  it("handles SET_VERTICAL_PRESET without overlay dimensions loaded", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 2,
    };
    const result = prepReducer(state, {
      type: "SET_VERTICAL_PRESET",
      payload: "short",
    });

    const yCanvas = Math.round((CANVAS_HEIGHT - VERTICAL_PRESET_CENTERS.short) * (CANVAS_WIDTH / CANVAS_WIDTH));
    const imgH = 300 * 2;
    const expectedY = Math.round(yCanvas - imgH / 2);
    expect(result.position.y).toBe(expectedY);
  });

  it("handles SET_VERTICAL_PRESET scaling proportionally for non-default canvas size", () => {
    const image = { width: 200, height: 300 } as HTMLImageElement;
    const customCanvasWidth = 3712;
    const customCanvasHeight = 4608;
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 2,
      canvasWidth: customCanvasWidth,
      canvasHeight: customCanvasHeight,
    };
    const result = prepReducer(state, {
      type: "SET_VERTICAL_PRESET",
      payload: "tall",
    });

    const scaleX = customCanvasWidth / CANVAS_WIDTH;
    const yCanvas = Math.round((CANVAS_HEIGHT - VERTICAL_PRESET_CENTERS.tall) * scaleX);
    const imgH = 300 * 2;
    const expectedY = Math.round(yCanvas - imgH / 2);
    expect(result.position.y).toBe(expectedY);
  });

  it("handles SET_VERTICAL_PRESET clamping Y to canvas bounds", () => {
    const image = { width: 200, height: 100 } as HTMLImageElement;
    const state: PrepState = {
      ...initialState,
      imageElement: image,
      scale: 0.5,
    };
    const result = prepReducer(state, {
      type: "SET_VERTICAL_PRESET",
      payload: "short",
    });

    const imgH = 100 * 0.5;
    expect(result.position.y).toBeGreaterThanOrEqual(0);
    expect(result.position.y).toBeLessThanOrEqual(CANVAS_HEIGHT - imgH);
  });

  it("handles SET_OVERLAY_NATIVE_DIMENSIONS", () => {
    const result = prepReducer(initialState, {
      type: "SET_OVERLAY_NATIVE_DIMENSIONS",
      payload: { width: 3072, height: 4096 },
    });

    expect(result.overlayNativeDimensions).toEqual({ width: 3072, height: 4096 });
  });
});

describe("getStepStatuses", () => {
  it("returns correct statuses for step 1", () => {
    expect(getStepStatuses(1)).toEqual(["active", "upcoming", "upcoming"]);
  });

  it("returns correct statuses for step 2", () => {
    expect(getStepStatuses(2)).toEqual(["completed", "active", "upcoming"]);
  });

  it("returns correct statuses for step 3", () => {
    expect(getStepStatuses(3)).toEqual(["completed", "completed", "active"]);
  });
});

describe("OVERLAY_OPTIONS", () => {
  it("contains overlay definitions with id, label, and filename", () => {
    expect(OVERLAY_OPTIONS.length).toBeGreaterThan(0);
    for (const option of OVERLAY_OPTIONS) {
      expect(option).toHaveProperty("id");
      expect(option).toHaveProperty("label");
      expect(option).toHaveProperty("filename");
    }
  });
});

describe("CANVAS_SIZE_PRESETS", () => {
  it("contains presets with label, width, and height", () => {
    expect(CANVAS_SIZE_PRESETS.length).toBeGreaterThan(0);
    for (const preset of CANVAS_SIZE_PRESETS) {
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("width");
      expect(preset).toHaveProperty("height");
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });

  it("has Default preset matching CANVAS_WIDTH and CANVAS_HEIGHT", () => {
    const defaultPreset = CANVAS_SIZE_PRESETS.find((p) => p.label === "Default");
    expect(defaultPreset).toBeDefined();
    expect(defaultPreset!.width).toBe(CANVAS_WIDTH);
    expect(defaultPreset!.height).toBe(CANVAS_HEIGHT);
  });
});

describe("VERTICAL_PRESET_CENTERS", () => {
  it("has entries for all four presets", () => {
    expect(VERTICAL_PRESET_CENTERS).toHaveProperty("short");
    expect(VERTICAL_PRESET_CENTERS).toHaveProperty("medium");
    expect(VERTICAL_PRESET_CENTERS).toHaveProperty("normal");
    expect(VERTICAL_PRESET_CENTERS).toHaveProperty("tall");
  });
});

describe("usePrepWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts at step 1 with no image", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.uploadedImage).toBeNull();
    expect(result.current.canDownload).toBe(false);
    expect(result.current.canContinue).toBe(false);
  });

  it("transitions to step 2 on uploadImage", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.uploadedImage).toBe("data:test");
    expect(result.current.state.fileName).toBe("test.png");
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_image_uploaded", {
      fileName: "test.png",
      width: 100,
      height: 100,
    });
  });

  it("updates position", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.updatePosition(10, 20);
    });

    expect(result.current.state.position).toEqual({ x: 10, y: 20 });
  });

  it("updates scale", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.updateScale(1.5);
    });

    expect(result.current.state.scale).toBe(1.5);
  });

  it("updates rotation", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.updateRotation(90);
    });

    expect(result.current.state.rotation).toBe(90);
  });

  it("transitions to step 3 on markPositioned", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });
    act(() => {
      result.current.markPositioned();
    });

    expect(result.current.state.currentStep).toBe(3);
    expect(result.current.state.isPositioned).toBe(true);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_image_positioned");
  });

  it("enables download when positioned", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });
    act(() => {
      result.current.markPositioned();
    });

    expect(result.current.canDownload).toBe(true);
    expect(result.current.canContinue).toBe(false);
  });

  it("enables continue when downloaded", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });
    act(() => {
      result.current.markPositioned();
    });
    act(() => {
      result.current.markDownloaded();
    });

    expect(result.current.canDownload).toBe(true);
    expect(result.current.canContinue).toBe(true);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_image_downloaded");
  });

  it("computes step statuses", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    expect(result.current.stepStatuses).toEqual([
      "active",
      "upcoming",
      "upcoming",
    ]);

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });

    expect(result.current.stepStatuses).toEqual([
      "completed",
      "active",
      "upcoming",
    ]);
  });

  it("toggles an overlay on", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.toggleOverlay("normal");
    });

    expect(result.current.state.selectedOverlays).toEqual(["normal"]);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_overlay_toggled", { overlay: "normal" });
  });

  it("toggles an overlay off", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.toggleOverlay("normal");
    });
    act(() => {
      result.current.toggleOverlay("normal");
    });

    expect(result.current.state.selectedOverlays).toEqual([]);
  });

  it("sets canvas data URL", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setCanvasDataUrl("data:image/png;base64,xyz");
    });

    expect(result.current.state.canvasDataUrl).toBe(
      "data:image/png;base64,xyz",
    );
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.uploadedImage).toBeNull();
  });

  it("resetWorkflow goes back to step 2 keeping the image", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage(), "test.png");
    });
    act(() => {
      result.current.markPositioned();
    });
    act(() => {
      result.current.resetWorkflow();
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.isPositioned).toBe(false);
    expect(result.current.state.isDownloaded).toBe(false);
    expect(result.current.state.uploadedImage).toBe("data:test");
  });

  it("sets canvas size", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setCanvasSize(2048, 2048);
    });

    expect(result.current.state.canvasWidth).toBe(2048);
    expect(result.current.state.canvasHeight).toBe(2048);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_canvas_size_set", { width: 2048, height: 2048 });
  });

  it("sets DPI override", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setDpiOverride(300);
    });

    expect(result.current.state.dpiOverride).toBe(300);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_dpi_override_set", { dpi: 300 });
  });

  it("clears DPI override", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setDpiOverride(300);
    });
    act(() => {
      result.current.setDpiOverride(null);
    });

    expect(result.current.state.dpiOverride).toBeNull();
    expect(vi.mocked(track)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_dpi_override_set", { dpi: 300 });
  });

  it("sets overlay opacity", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setOverlayOpacity("normal", 50);
    });

    expect(result.current.state.overlayOpacities.normal).toBe(50);
  });

  it("sets keep aspect ratio", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setKeepAspectRatio(false);
    });

    expect(result.current.state.keepAspectRatio).toBe(false);
  });

  it("sets algorithm", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setAlgorithm("standard");
    });

    expect(result.current.state.algorithm).toBe("standard");
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_algorithm_set", { algorithm: "standard" });
  });

  it("sets image dimensions", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.setImageDimensions(400, 600);
    });

    expect(result.current.state.scale).toBe(2);
  });

  it("centers horizontally", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.updatePosition(50, 100);
    });
    act(() => {
      result.current.centerHorizontal();
    });

    const scale = result.current.state.scale;
    expect(result.current.state.position.x).toBe((CANVAS_WIDTH - 200 * scale) / 2);
    expect(result.current.state.position.y).toBe(100);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_alignment_used", { action: "center_horizontal" });
  });

  it("centers vertically", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.updatePosition(50, 100);
    });
    act(() => {
      result.current.centerVertical();
    });

    const scale = result.current.state.scale;
    expect(result.current.state.position.x).toBe(50);
    expect(result.current.state.position.y).toBe((CANVAS_HEIGHT - 300 * scale) / 2);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_alignment_used", { action: "center_vertical" });
  });

  it("fits width", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.fitWidth();
    });

    const fitScale = CANVAS_WIDTH / 200;
    expect(result.current.state.scale).toBe(fitScale);
    expect(result.current.state.position.x).toBe(0);
    expect(result.current.state.position.y).toBe((CANVAS_HEIGHT - 300 * fitScale) / 2);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_alignment_used", { action: "fit_width" });
  });

  it("fits height", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.fitHeight();
    });

    const fitScale = CANVAS_HEIGHT / 300;
    expect(result.current.state.scale).toBe(fitScale);
    expect(result.current.state.position.x).toBe((CANVAS_WIDTH - 200 * fitScale) / 2);
    expect(result.current.state.position.y).toBe(0);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_alignment_used", { action: "fit_height" });
  });

  it("sets vertical preset", () => {
    const { result } = renderHook(() => usePrepWorkflow());
    const image = { width: 200, height: 300 } as HTMLImageElement;

    act(() => {
      result.current.uploadImage("data:test", image, "test.png");
    });
    act(() => {
      result.current.setVerticalPreset("normal");
    });

    const scale = result.current.state.scale;
    const yCanvas = Math.round((CANVAS_HEIGHT - VERTICAL_PRESET_CENTERS.normal) * (CANVAS_WIDTH / CANVAS_WIDTH));
    const imgH = 300 * scale;
    const expectedY = Math.max(0, Math.min(Math.round(yCanvas - imgH / 2), CANVAS_HEIGHT - imgH));
    expect(result.current.state.position.y).toBe(expectedY);
    expect(vi.mocked(track)).toHaveBeenCalledWith("prep_vertical_preset_used", { preset: "normal" });
  });

  it("sets overlay native dimensions", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.setOverlayNativeDimensions({ width: 3072, height: 4096 });
    });

    expect(result.current.state.overlayNativeDimensions).toEqual({ width: 3072, height: 4096 });
  });

  it("syncs canvas size to sessionStorage on mount with defaults", () => {
    // Given
    sessionStorage.clear();

    // When
    renderHook(() => usePrepWorkflow());

    // Then
    const stored = sessionStorage.getItem(PREP_CANVAS_SIZE_KEY);
    expect(JSON.parse(stored!)).toEqual({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  });

  it("updates sessionStorage when canvas size changes", () => {
    // Given
    sessionStorage.clear();
    const { result } = renderHook(() => usePrepWorkflow());

    // When
    act(() => {
      result.current.setCanvasSize(3264, 2448);
    });

    // Then
    const stored = sessionStorage.getItem(PREP_CANVAS_SIZE_KEY);
    expect(JSON.parse(stored!)).toEqual({ width: 3264, height: 2448 });
  });

  it("fires analytics when the canvas sizing mode is set", () => {
    // Given
    const { result } = renderHook(() => usePrepWorkflow());

    // When
    act(() => {
      result.current.setCanvasSizingMode("native-image");
    });

    // Then
    expect(result.current.state.canvasSizingMode).toBe("native-image");
    expect(track).toHaveBeenCalledWith("prep_canvas_sizing_mode_set", {
      mode: "native-image",
    });
  });

  it("fires analytics when the canvas size step is set", () => {
    // Given
    const { result } = renderHook(() => usePrepWorkflow());

    // When
    act(() => {
      result.current.setCanvasSizeStep(200);
    });

    // Then
    expect(result.current.state.canvasWidth).toBe(2200);
    expect(track).toHaveBeenCalledWith("prep_canvas_size_step_set", {
      step: 200,
    });
  });
});

describe("prepReducer canvas sizing mode", () => {
  it("starts in the scaled-image mode", () => {
    // Then
    expect(initialState.canvasSizingMode).toBe("scale-image");
  });

  it("locks image scale to exactly 1 when entering native-image mode", () => {
    // Given
    const state: PrepState = { ...initialState, scale: 4 };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZING_MODE",
      payload: "native-image",
    });

    // Then
    expect(result.scale).toBe(1);
    expect(result.canvasSizingMode).toBe("native-image");
  });

  it("leaves the image position untouched when entering native-image mode", () => {
    // Given
    const state: PrepState = {
      ...initialState,
      scale: 4,
      position: { x: -900, y: 12345 },
    };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZING_MODE",
      payload: "native-image",
    });

    // Then
    expect(result.position).toEqual({ x: -900, y: 12345 });
  });

  it("snaps a non-11:15 canvas to the nearest legal size when entering native-image mode", () => {
    // Given
    const state: PrepState = {
      ...initialState,
      canvasWidth: 3712,
      canvasHeight: 4608,
    };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZING_MODE",
      payload: "native-image",
    });

    // Then
    expect(result.canvasWidth).toBe(3707);
    expect(result.canvasHeight).toBe(5055);
  });

  it("leaves the default canvas unchanged when entering native-image mode", () => {
    // When
    const result = prepReducer(initialState, {
      type: "SET_CANVAS_SIZING_MODE",
      payload: "native-image",
    });

    // Then
    expect(result.canvasWidth).toBe(CANVAS_WIDTH);
    expect(result.canvasHeight).toBe(CANVAS_HEIGHT);
  });

  it("keeps canvas size and scale when switching back to scale-image mode", () => {
    // Given
    const state: PrepState = {
      ...nativeState,
      canvasWidth: 2200,
      canvasHeight: 3000,
      scale: 1,
    };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZING_MODE",
      payload: "scale-image",
    });

    // Then
    expect(result.canvasSizingMode).toBe("scale-image");
    expect(result.canvasWidth).toBe(2200);
    expect(result.canvasHeight).toBe(3000);
    expect(result.scale).toBe(1);
  });
});

describe("prepReducer SET_CANVAS_SIZE_STEP", () => {
  it("sets the canvas to the 11:15 size for the step", () => {
    // When
    const result = prepReducer(nativeState, {
      type: "SET_CANVAS_SIZE_STEP",
      payload: MIN_CANVAS_STEP,
    });

    // Then
    expect({ width: result.canvasWidth, height: result.canvasHeight }).toEqual(
      canvasSizeForStep(MIN_CANVAS_STEP),
    );
  });

  it("keeps the image offset from the canvas centre when growing", () => {
    // Given
    const image = makeImage();
    const state: PrepState = {
      ...nativeState,
      imageElement: image,
      position: { x: 1710, y: 2350 },
    };
    const offsetBefore = {
      x: state.position.x + image.width / 2 - state.canvasWidth / 2,
      y: state.position.y + image.height / 2 - state.canvasHeight / 2,
    };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZE_STEP",
      payload: MAX_CANVAS_STEP,
    });

    // Then
    expect({
      x: result.position.x + image.width / 2 - result.canvasWidth / 2,
      y: result.position.y + image.height / 2 - result.canvasHeight / 2,
    }).toEqual(offsetBefore);
  });

  it("keeps the image offset from the canvas centre when shrinking a dragged image", () => {
    // Given
    const image = makeImage();
    const state: PrepState = {
      ...nativeState,
      imageElement: image,
      position: { x: -400, y: 90 },
    };
    const offsetBefore = {
      x: state.position.x + image.width / 2 - state.canvasWidth / 2,
      y: state.position.y + image.height / 2 - state.canvasHeight / 2,
    };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZE_STEP",
      payload: MIN_CANVAS_STEP,
    });

    // Then
    expect({
      x: result.position.x + image.width / 2 - result.canvasWidth / 2,
      y: result.position.y + image.height / 2 - result.canvasHeight / 2,
    }).toEqual(offsetBefore);
  });

  it("never alters the image scale", () => {
    // Given
    const state: PrepState = { ...nativeState, scale: 1 };

    // When
    const result = prepReducer(state, {
      type: "SET_CANVAS_SIZE_STEP",
      payload: 500,
    });

    // Then
    expect(result.scale).toBe(1);
  });
});

describe("prepReducer UPLOAD_IMAGE in native-image mode", () => {
  it("keeps scale at 1 and centres the image in the current canvas", () => {
    // Given
    const element = makeImage();

    // When
    const result = prepReducer(nativeState, {
      type: "UPLOAD_IMAGE",
      payload: { dataUrl: "data:image/png;base64,abc", element, fileName: "c.png" },
    });

    // Then
    expect(result.scale).toBe(1);
    expect(result.position).toEqual({
      x: (CANVAS_WIDTH - element.width) / 2,
      y: (CANVAS_HEIGHT - element.height) / 2,
    });
  });
});
