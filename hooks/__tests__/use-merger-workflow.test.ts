import { renderHook, act } from "@testing-library/react";
import {
  mergerReducer,
  getMergerStepStatuses,
  useMergerWorkflow,
  initialState,
  type MergerState,
} from "../use-merger-workflow";
import * as mergerUtils from "@/lib/merger-utils";
import { track } from "@/lib/analytics";

vi.mock("@/lib/merger-utils", () => ({
  analyzeGuide: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const makeImage = (w: number, h: number) => {
  const img = new Image();
  Object.defineProperty(img, "naturalWidth", { value: w });
  Object.defineProperty(img, "naturalHeight", { value: h });
  return img;
};

const makeGuideCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  return canvas;
};

const mockAnalysis = {
  canvasW: 800,
  canvasH: 1200,
  ogX: 200,
  ogY: 300,
};

describe("mergerReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = mergerReducer(initialState, { type: "UNKNOWN" } as never);
    expect(result).toEqual(initialState);
  });

  it("handles UPLOAD_OG", () => {
    const img = makeImage(400, 600);
    const result = mergerReducer(initialState, {
      type: "UPLOAD_OG",
      payload: { image: img, fileName: "card.png", fileSize: 1024 },
    });

    expect(result.currentStep).toBe(2);
    expect(result.ogImage).toBe(img);
    expect(result.ogFileName).toBe("card.png");
    expect(result.ogFileSize).toBe(1024);
    expect(result.canvasW).toBe(400);
    expect(result.canvasH).toBe(600);
    expect(result.ogPosition).toEqual({ x: 0, y: 0, w: 400, h: 600 });
  });

  it("resets downstream state on UPLOAD_OG", () => {
    const state: MergerState = {
      ...initialState,
      currentStep: 3,
      guideImage: makeImage(100, 100),
      guideFileName: "guide.png",
      guideFileSize: 500,
      outpaintImage: makeImage(100, 100),
      outpaintFileName: "outpaint.png",
      outpaintFileSize: 800,
      isDownloaded: true,
    };

    const result = mergerReducer(state, {
      type: "UPLOAD_OG",
      payload: {
        image: makeImage(200, 300),
        fileName: "new.png",
        fileSize: 2048,
      },
    });

    expect(result.guideImage).toBeNull();
    expect(result.guideFileName).toBeNull();
    expect(result.outpaintImage).toBeNull();
    expect(result.isDownloaded).toBe(false);
  });

  it("handles UPLOAD_GUIDE with analysis result", () => {
    const ogImg = makeImage(400, 600);
    const state: MergerState = {
      ...initialState,
      currentStep: 2,
      ogImage: ogImg,
      ogFileName: "card.png",
      ogFileSize: 1024,
      canvasW: 400,
      canvasH: 600,
      ogPosition: { x: 0, y: 0, w: 400, h: 600 },
    };

    const guideImg = makeImage(200, 200);

    const result = mergerReducer(state, {
      type: "UPLOAD_GUIDE",
      payload: {
        image: guideImg,
        fileName: "guide.png",
        fileSize: 512,
        analysis: mockAnalysis,
      },
    });

    expect(result.currentStep).toBe(3);
    expect(result.guideImage).toBe(guideImg);
    expect(result.guideFileName).toBe("guide.png");
    expect(result.guideFileSize).toBe(512);
    expect(result.canvasW).toBe(800);
    expect(result.canvasH).toBe(1200);
    expect(result.ogPosition).toEqual({ x: 200, y: 300, w: 400, h: 600 });
  });

  it("does not change state on UPLOAD_GUIDE when no OG image", () => {
    const result = mergerReducer(initialState, {
      type: "UPLOAD_GUIDE",
      payload: {
        image: makeImage(100, 100),
        fileName: "guide.png",
        fileSize: 512,
        analysis: mockAnalysis,
      },
    });

    expect(result).toEqual(initialState);
  });

  it("resets downstream state on UPLOAD_GUIDE", () => {
    const state: MergerState = {
      ...initialState,
      currentStep: 2,
      ogImage: makeImage(400, 600),
      outpaintImage: makeImage(100, 100),
      outpaintFileName: "old.png",
      outpaintFileSize: 999,
      isDownloaded: true,
    };

    const result = mergerReducer(state, {
      type: "UPLOAD_GUIDE",
      payload: {
        image: makeImage(100, 100),
        fileName: "guide.png",
        fileSize: 512,
        analysis: mockAnalysis,
      },
    });

    expect(result.outpaintImage).toBeNull();
    expect(result.outpaintFileName).toBeNull();
    expect(result.outpaintFileSize).toBeNull();
    expect(result.isDownloaded).toBe(false);
  });

  it("handles UPLOAD_OUTPAINT", () => {
    const outpaintImg = makeImage(800, 1200);
    const result = mergerReducer(initialState, {
      type: "UPLOAD_OUTPAINT",
      payload: {
        image: outpaintImg,
        fileName: "outpaint.png",
        fileSize: 2048,
      },
    });

    expect(result.outpaintImage).toBe(outpaintImg);
    expect(result.outpaintFileName).toBe("outpaint.png");
    expect(result.outpaintFileSize).toBe(2048);
    expect(result.isDownloaded).toBe(false);
  });

  it("handles SET_FEATHER", () => {
    const result = mergerReducer(initialState, {
      type: "SET_FEATHER",
      payload: 80,
    });
    expect(result.featherStrength).toBe(80);
  });

  it("handles SET_IRREG_MAGNITUDE", () => {
    const result = mergerReducer(initialState, {
      type: "SET_IRREG_MAGNITUDE",
      payload: 200,
    });
    expect(result.irregMagnitude).toBe(200);
  });

  it("handles SET_IRREG_DENSITY", () => {
    const result = mergerReducer(initialState, {
      type: "SET_IRREG_DENSITY",
      payload: 50,
    });
    expect(result.irregDensity).toBe(50);
  });

  it("handles SET_IRREG_RADIUS", () => {
    const result = mergerReducer(initialState, {
      type: "SET_IRREG_RADIUS",
      payload: 250,
    });
    expect(result.irregRadius).toBe(250);
  });

  it("handles SET_IRREG_BLUR", () => {
    const result = mergerReducer(initialState, {
      type: "SET_IRREG_BLUR",
      payload: 30,
    });
    expect(result.irregBlur).toBe(30);
  });

  it("handles SET_IRREG_SEED", () => {
    const result = mergerReducer(initialState, {
      type: "SET_IRREG_SEED",
      payload: 99999,
    });
    expect(result.irregSeed).toBe(99999);
  });

  it("handles MARK_DOWNLOADED", () => {
    const result = mergerReducer(initialState, { type: "MARK_DOWNLOADED" });
    expect(result.isDownloaded).toBe(true);
  });

  it("handles RESET", () => {
    const state: MergerState = {
      ...initialState,
      currentStep: 3,
      ogImage: makeImage(400, 600),
      ogFileName: "card.png",
      ogFileSize: 1024,
      isDownloaded: true,
    };

    const result = mergerReducer(state, { type: "RESET" });
    expect(result).toEqual(initialState);
  });
});

describe("getMergerStepStatuses", () => {
  it("returns correct statuses for step 1", () => {
    expect(getMergerStepStatuses(1)).toEqual([
      "active",
      "upcoming",
      "upcoming",
    ]);
  });

  it("returns correct statuses for step 2", () => {
    expect(getMergerStepStatuses(2)).toEqual([
      "completed",
      "active",
      "upcoming",
    ]);
  });

  it("returns correct statuses for step 3", () => {
    expect(getMergerStepStatuses(3)).toEqual([
      "completed",
      "completed",
      "active",
    ]);
  });
});

describe("useMergerWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mergerUtils.analyzeGuide).mockReturnValue({
      canvasW: 800,
      canvasH: 1200,
      ogX: 200,
      ogY: 300,
    });
  });

  it("starts at step 1 with no images", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.ogImage).toBeNull();
    expect(result.current.canDownload).toBe(false);
  });

  it("transitions to step 2 on uploadOg", () => {
    const { result } = renderHook(() => useMergerWorkflow());
    const img = makeImage(400, 600);

    act(() => {
      result.current.uploadOg(img, "card.png", 1024);
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.ogImage).toBe(img);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_og_uploaded", {
      fileName: "card.png",
      fileSize: 1024,
      width: 400,
      height: 600,
    });
  });

  it("transitions to step 3 on uploadGuide", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.uploadOg(makeImage(400, 600), "card.png", 1024);
    });
    act(() => {
      result.current.uploadGuide(
        makeImage(200, 200),
        "guide.png",
        512,
        makeGuideCanvas(),
      );
    });

    expect(result.current.state.currentStep).toBe(3);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_guide_uploaded", {
      fileName: "guide.png",
      fileSize: 512,
    });
  });

  it("does not transition when analyzeGuide returns null", () => {
    vi.mocked(mergerUtils.analyzeGuide).mockReturnValue(null);

    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.uploadOg(makeImage(400, 600), "card.png", 1024);
    });
    act(() => {
      result.current.uploadGuide(
        makeImage(200, 200),
        "guide.png",
        512,
        makeGuideCanvas(),
      );
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(vi.mocked(track)).not.toHaveBeenCalledWith("merger_guide_uploaded", expect.anything());
  });

  it("does not transition when no OG image uploaded", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.uploadGuide(
        makeImage(200, 200),
        "guide.png",
        512,
        makeGuideCanvas(),
      );
    });

    expect(result.current.state.currentStep).toBe(1);
  });

  it("enables download when all 3 images are uploaded", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.uploadOg(makeImage(400, 600), "card.png", 1024);
    });
    act(() => {
      result.current.uploadGuide(
        makeImage(200, 200),
        "guide.png",
        512,
        makeGuideCanvas(),
      );
    });
    act(() => {
      result.current.uploadOutpaint(makeImage(800, 1200), "outpaint.png", 2048);
    });

    expect(result.current.canDownload).toBe(true);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_outpaint_uploaded", {
      fileName: "outpaint.png",
      fileSize: 2048,
    });
  });

  it("updates feather strength", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setFeather(80);
    });

    expect(result.current.state.featherStrength).toBe(80);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "feather", value: 80 });
  });

  it("updates irregular edge magnitude", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setIrregMagnitude(200);
    });

    expect(result.current.state.irregMagnitude).toBe(200);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_magnitude", value: 200 });
  });

  it("updates irregular edge density", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setIrregDensity(50);
    });

    expect(result.current.state.irregDensity).toBe(50);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_density", value: 50 });
  });

  it("updates irregular edge radius", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setIrregRadius(250);
    });

    expect(result.current.state.irregRadius).toBe(250);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_radius", value: 250 });
  });

  it("updates irregular edge blur", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setIrregBlur(30);
    });

    expect(result.current.state.irregBlur).toBe(30);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_blending_adjusted", { param: "irreg_blur", value: 30 });
  });

  it("reseeds irregular edge with new random value", () => {
    const { result } = renderHook(() => useMergerWorkflow());
    const originalSeed = result.current.state.irregSeed;

    vi.spyOn(Math, "random").mockReturnValue(0.5);

    act(() => {
      result.current.reseed();
    });

    expect(result.current.state.irregSeed).toBe(50000);
    expect(result.current.state.irregSeed).not.toBe(originalSeed);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_reseeded");

    vi.restoreAllMocks();
  });

  it("marks as downloaded", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.markDownloaded();
    });

    expect(result.current.state.isDownloaded).toBe(true);
    expect(vi.mocked(track)).toHaveBeenCalledWith("merger_final_downloaded");
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.uploadOg(makeImage(400, 600), "card.png", 1024);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.ogImage).toBeNull();
  });

  it("computes step statuses", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    expect(result.current.stepStatuses).toEqual([
      "active",
      "upcoming",
      "upcoming",
    ]);

    act(() => {
      result.current.uploadOg(makeImage(400, 600), "card.png", 1024);
    });

    expect(result.current.stepStatuses).toEqual([
      "completed",
      "active",
      "upcoming",
    ]);
  });
});
