import { renderHook, act } from "@testing-library/react";
import {
  mergerReducer,
  getMergerStepStatuses,
  useMergerWorkflow,
  initialState,
  type MergerState,
} from "../use-merger-workflow";
import * as mergerUtils from "@/lib/merger-utils";

vi.mock("@/lib/merger-utils", () => ({
  analyzeGuide: vi.fn(),
}));

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

  it("handles UPLOAD_GUIDE with successful analysis", () => {
    vi.mocked(mergerUtils.analyzeGuide).mockReturnValue({
      canvasW: 800,
      canvasH: 1200,
      ogX: 200,
      ogY: 300,
    });

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
    const guideCanvas = makeGuideCanvas();

    const result = mergerReducer(state, {
      type: "UPLOAD_GUIDE",
      payload: {
        image: guideImg,
        fileName: "guide.png",
        fileSize: 512,
        guideCanvas,
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
        guideCanvas: makeGuideCanvas(),
      },
    });

    expect(result).toEqual(initialState);
  });

  it("does not change state on UPLOAD_GUIDE when analysis returns null", () => {
    vi.mocked(mergerUtils.analyzeGuide).mockReturnValue(null);

    const ogImg = makeImage(400, 600);
    const state: MergerState = {
      ...initialState,
      currentStep: 2,
      ogImage: ogImg,
    };

    const result = mergerReducer(state, {
      type: "UPLOAD_GUIDE",
      payload: {
        image: makeImage(100, 100),
        fileName: "guide.png",
        fileSize: 512,
        guideCanvas: makeGuideCanvas(),
      },
    });

    expect(result).toEqual(state);
  });

  it("resets downstream state on UPLOAD_GUIDE", () => {
    vi.mocked(mergerUtils.analyzeGuide).mockReturnValue({
      canvasW: 800,
      canvasH: 1200,
      ogX: 200,
      ogY: 300,
    });

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
        guideCanvas: makeGuideCanvas(),
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
  });

  it("updates feather strength", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.setFeather(80);
    });

    expect(result.current.state.featherStrength).toBe(80);
  });

  it("marks as downloaded", () => {
    const { result } = renderHook(() => useMergerWorkflow());

    act(() => {
      result.current.markDownloaded();
    });

    expect(result.current.state.isDownloaded).toBe(true);
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
