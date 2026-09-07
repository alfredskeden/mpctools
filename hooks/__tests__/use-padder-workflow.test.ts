import { renderHook, act } from "@testing-library/react";
import {
  usePadderWorkflow,
  padderReducer,
  initialState,
} from "../use-padder-workflow";
import { PADDER_TARGET_KEY } from "@/lib/padder-prompts";
import { PAD_TARGETS } from "@/lib/padder-math";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const makeImage = (width: number, height: number) => {
  const img = new Image();
  Object.defineProperty(img, "width", { value: width });
  Object.defineProperty(img, "height", { value: height });
  return img;
};

describe("padderReducer", () => {
  it("ignores an unknown action", () => {
    // Given / When
    const next = padderReducer(initialState, {
      type: "UNKNOWN",
    } as unknown as Parameters<typeof padderReducer>[1]);

    // Then
    expect(next).toBe(initialState);
  });
});

describe("usePadderWorkflow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(track).mockClear();
  });

  it("offers no layout and no download before an upload", () => {
    // Given / When
    const { result } = renderHook(() => usePadderWorkflow());

    // Then
    expect(result.current.layout).toBeNull();
    expect(result.current.canDownload).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it("derives the layout from an uploaded image", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());

    // When
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // Then
    expect(result.current.layout?.canvas).toEqual({ width: 816, height: 1110 });
    expect(result.current.canDownload).toBe(true);
  });

  it("tracks the upload", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());

    // When
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // Then
    expect(track).toHaveBeenCalledWith(
      "padder_image_uploaded",
      expect.objectContaining({ width: 745, height: 1040 }),
    );
  });

  it("recomputes the layout when the target changes", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // When
    act(() => result.current.selectTarget("classic-borderless"));

    // Then
    expect(result.current.layout?.canvas).toEqual({ width: 816, height: 1013 });
    expect(result.current.layout?.croppedPixels).toBe(62);
    expect(track).toHaveBeenCalledWith("padder_target_selected", {
      target: "classic-borderless",
    });
  });

  it("falls back to the default target for an unknown id", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // When
    act(() => result.current.selectTarget("nope" as never));

    // Then
    expect(result.current.target).toEqual(PAD_TARGETS[0]);
    expect(result.current.layout?.canvas).toEqual({ width: 816, height: 1110 });
  });

  it("surfaces an error and blocks download for a non-portrait image", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());

    // When
    act(() => result.current.uploadImage(makeImage(1040, 745), "landscape.png"));

    // Then
    expect(result.current.hasError).toBe(true);
    expect(result.current.layout).toBeNull();
    expect(result.current.canDownload).toBe(false);
  });

  it("marks the workflow downloaded and unlocks continuing", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // When
    act(() => result.current.markDownloaded());

    // Then
    expect(result.current.state.downloaded).toBe(true);
    expect(result.current.canContinue).toBe(true);
    expect(track).toHaveBeenCalledWith("padder_image_downloaded", {
      target: PAD_TARGETS[0].id,
    });
  });

  it("does not allow continuing before a download", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());

    // When
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // Then
    expect(result.current.canContinue).toBe(false);
  });

  it("stores the resulting target for the outpaint page", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());

    // When
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));

    // Then
    expect(
      JSON.parse(sessionStorage.getItem(PADDER_TARGET_KEY) ?? "{}"),
    ).toEqual({
      width: 816,
      height: 1110,
      ratioLabel: "11:15",
    });
  });

  it("stores nothing while there is no layout", () => {
    // Given / When
    renderHook(() => usePadderWorkflow());

    // Then
    expect(sessionStorage.getItem(PADDER_TARGET_KEY)).toBeNull();
  });

  it("resets the downloaded flag when a new image is uploaded", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));
    act(() => result.current.markDownloaded());

    // When
    act(() => result.current.uploadImage(makeImage(672, 936), "other.png"));

    // Then
    expect(result.current.state.downloaded).toBe(false);
    expect(result.current.state.fileName).toBe("other.png");
  });

  it("resets the downloaded flag when the target changes", () => {
    // Given
    const { result } = renderHook(() => usePadderWorkflow());
    act(() => result.current.uploadImage(makeImage(745, 1040), "scan.png"));
    act(() => result.current.markDownloaded());

    // When
    act(() => result.current.selectTarget("classic-borderless"));

    // Then
    expect(result.current.state.downloaded).toBe(false);
  });
});
