import { renderHook, act } from "@testing-library/react";
import {
  prepReducer,
  getStepStatuses,
  usePrepWorkflow,
  OVERLAY_OPTIONS,
  type PrepState,
} from "../use-prep-workflow";

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
  selectedOverlay: null,
  canvasDataUrl: null,
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

    expect(result.position).toEqual({ x: 0, y: 0 });
    expect(result.scale).toBe(1); // 100x100 fits in 816x1110, so scale stays 1
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

  it("handles UPDATE_SCALE", () => {
    const result = prepReducer(initialState, {
      type: "UPDATE_SCALE",
      payload: 1.5,
    });

    expect(result.scale).toBe(1.5);
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

  it("handles SELECT_OVERLAY", () => {
    const result = prepReducer(initialState, {
      type: "SELECT_OVERLAY",
      payload: "normal",
    });

    expect(result.selectedOverlay).toBe("normal");
  });

  it("handles SELECT_OVERLAY with null to deselect", () => {
    const state: PrepState = { ...initialState, selectedOverlay: "normal" };
    const result = prepReducer(state, {
      type: "SELECT_OVERLAY",
      payload: null,
    });

    expect(result.selectedOverlay).toBeNull();
  });

  it("sets selectedOverlay to tall_normal on UPLOAD_IMAGE", () => {
    const state: PrepState = { ...initialState, selectedOverlay: "normal" };
    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: {
        dataUrl: "data:new",
        element: makeImage(),
        fileName: "new.png",
      },
    });

    expect(result.selectedOverlay).toBe("tall_normal");
  });

  it("handles SET_CANVAS_DATA_URL", () => {
    const result = prepReducer(initialState, {
      type: "SET_CANVAS_DATA_URL",
      payload: "data:image/png;base64,xyz",
    });

    expect(result.canvasDataUrl).toBe("data:image/png;base64,xyz");
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
      selectedOverlay: null,
    };

    const result = prepReducer(state, { type: "RESET" });
    expect(result).toEqual(initialState);
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

describe("usePrepWorkflow", () => {
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

  it("selects an overlay", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.selectOverlay("normal");
    });

    expect(result.current.state.selectedOverlay).toBe("normal");
  });

  it("deselects overlay with null", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.selectOverlay("normal");
    });
    act(() => {
      result.current.selectOverlay(null);
    });

    expect(result.current.state.selectedOverlay).toBeNull();
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
});
