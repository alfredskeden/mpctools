import { renderHook, act } from "@testing-library/react";
import { prepReducer, getStepStatuses, usePrepWorkflow, OVERLAY_OPTIONS } from "./use-prep-workflow";
import type { PrepState } from "./use-prep-workflow";

const makeImage = () => ({ width: 100, height: 100 }) as HTMLImageElement;

const initialState: PrepState = {
  currentStep: 1,
  uploadedImage: null,
  imageElement: null,
  position: { x: 0, y: 0 },
  scale: 1,
  isPositioned: false,
  canvasDataUrl: null,
  selectedOverlay: null,
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
      payload: { dataUrl: "data:image/png;base64,abc", element },
    });

    expect(result.currentStep).toBe(2);
    expect(result.uploadedImage).toBe("data:image/png;base64,abc");
    expect(result.imageElement).toBe(element);
    expect(result.isPositioned).toBe(false);
  });

  it("resets position and scale on new upload", () => {
    const state: PrepState = {
      ...initialState,
      currentStep: 3,
      position: { x: 50, y: 50 },
      scale: 2,
      isPositioned: true,
      canvasDataUrl: "data:old",
    };

    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: { dataUrl: "data:new", element: makeImage() },
    });

    expect(result.position).toEqual({ x: 0, y: 0 });
    expect(result.scale).toBe(1);
    expect(result.isPositioned).toBe(false);
    expect(result.canvasDataUrl).toBeNull();
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

  it("handles MARK_POSITIONED", () => {
    const state: PrepState = { ...initialState, currentStep: 2 };
    const result = prepReducer(state, { type: "MARK_POSITIONED" });

    expect(result.currentStep).toBe(3);
    expect(result.isPositioned).toBe(true);
  });

  it("handles SET_CANVAS_DATA_URL", () => {
    const result = prepReducer(initialState, {
      type: "SET_CANVAS_DATA_URL",
      payload: "data:image/png;base64,xyz",
    });

    expect(result.canvasDataUrl).toBe("data:image/png;base64,xyz");
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

  it("resets selectedOverlay on UPLOAD_IMAGE", () => {
    const state: PrepState = { ...initialState, selectedOverlay: "normal" };
    const result = prepReducer(state, {
      type: "UPLOAD_IMAGE",
      payload: { dataUrl: "data:new", element: makeImage() },
    });

    expect(result.selectedOverlay).toBeNull();
  });

  it("handles RESET", () => {
    const state: PrepState = {
      currentStep: 3,
      uploadedImage: "data:test",
      imageElement: makeImage(),
      position: { x: 50, y: 50 },
      scale: 2,
      isPositioned: true,
      canvasDataUrl: "data:canvas",
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
      result.current.uploadImage("data:test", makeImage());
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.uploadedImage).toBe("data:test");
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

  it("transitions to step 3 on markPositioned", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage());
    });
    act(() => {
      result.current.markPositioned();
    });

    expect(result.current.state.currentStep).toBe(3);
    expect(result.current.state.isPositioned).toBe(true);
  });

  it("enables download when positioned and data url is set", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage());
    });
    act(() => {
      result.current.markPositioned();
    });
    act(() => {
      result.current.setCanvasDataUrl("data:canvas");
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
      result.current.uploadImage("data:test", makeImage());
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

  it("resets to initial state", () => {
    const { result } = renderHook(() => usePrepWorkflow());

    act(() => {
      result.current.uploadImage("data:test", makeImage());
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.uploadedImage).toBeNull();
  });
});
