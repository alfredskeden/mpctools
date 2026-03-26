import { renderHook, act } from "@testing-library/react";
import {
  outpaintReducer,
  useOutpaintWorkflow,
  buildHandshakePrompt,
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
  type OutpaintState,
} from "../use-outpaint-workflow";
import { track } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const initialState: OutpaintState = {
  currentStep: 1,
  handshakeSent: false,
  handshakeCollapsed: false,
};

describe("outpaintReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = outpaintReducer(initialState, { type: "UNKNOWN" } as never);
    expect(result).toEqual(initialState);
  });

  it("handles SEND_HANDSHAKE", () => {
    const result = outpaintReducer(initialState, { type: "SEND_HANDSHAKE" });
    expect(result.currentStep).toBe(2);
    expect(result.handshakeSent).toBe(true);
    expect(result.handshakeCollapsed).toBe(true);
  });

  it("handles TOGGLE_HANDSHAKE_COLLAPSE", () => {
    const state: OutpaintState = {
      ...initialState,
      handshakeCollapsed: true,
    };
    const result = outpaintReducer(state, {
      type: "TOGGLE_HANDSHAKE_COLLAPSE",
    });
    expect(result.handshakeCollapsed).toBe(false);
  });

  it("handles TOGGLE_HANDSHAKE_COLLAPSE from false to true", () => {
    const result = outpaintReducer(initialState, {
      type: "TOGGLE_HANDSHAKE_COLLAPSE",
    });
    expect(result.handshakeCollapsed).toBe(true);
  });

  it("handles RESET", () => {
    const state: OutpaintState = {
      currentStep: 2,
      handshakeSent: true,
      handshakeCollapsed: true,
    };
    const result = outpaintReducer(state, { type: "RESET" });
    expect(result).toEqual(initialState);
  });
});

describe("buildHandshakePrompt", () => {
  it("uses portrait orientation for default canvas (3520x4800)", () => {
    // Given
    const width = 3520;
    const height = 4800;

    // When
    const result = buildHandshakePrompt(width, height);

    // Then
    expect(result).toContain("11:15 Vertical Ratio");
    expect(result).toContain("Portrait orientation 11:15 aspect ratio");
  });

  it("uses landscape orientation for 4:3 canvas", () => {
    // Given
    const width = 3264;
    const height = 2448;

    // When
    const result = buildHandshakePrompt(width, height);

    // Then
    expect(result).toContain("4:3 Horizontal Ratio");
    expect(result).toContain("Landscape orientation 4:3 aspect ratio");
  });

  it("uses square orientation for 1:1 canvas", () => {
    // Given
    const width = 2048;
    const height = 2048;

    // When
    const result = buildHandshakePrompt(width, height);

    // Then
    expect(result).toContain("1:1 Square Ratio");
    expect(result).toContain("Square orientation 1:1 aspect ratio");
  });

  it("uses portrait orientation for 9:16 canvas", () => {
    // Given
    const width = 1836;
    const height = 3264;

    // When
    const result = buildHandshakePrompt(width, height);

    // Then
    expect(result).toContain("9:16 Vertical Ratio");
    expect(result).toContain("Portrait orientation 9:16 aspect ratio");
  });

  it("preserves the rest of the prompt unchanged", () => {
    // Given/When
    const result = buildHandshakePrompt(3520, 4800);

    // Then
    expect(result).toContain("High-Fidelity Neutral Photo Extender");
    expect(result).toContain("Sacred Core Firewall");
    expect(result).toContain(
      "Universal Neutral Extension Mode Locked. Ready for any input.",
    );
  });
});

describe("prompt constants", () => {
  it("exports HANDSHAKE_PROMPT", () => {
    expect(HANDSHAKE_PROMPT).toContain("High-Fidelity Neutral Photo Extender");
  });

  it("HANDSHAKE_PROMPT equals buildHandshakePrompt with default canvas", () => {
    // Given
    const defaultPrompt = buildHandshakePrompt(3520, 4800);

    // Then
    expect(HANDSHAKE_PROMPT).toBe(defaultPrompt);
  });

  it("exports OUTPAINT_COMMAND", () => {
    expect(OUTPAINT_COMMAND).toContain("NEW PROJECT / MEMORY FLUSH");
  });
});

describe("useOutpaintWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts at step 1 with handshake not sent", () => {
    const { result } = renderHook(() => useOutpaintWorkflow());
    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.handshakeSent).toBe(false);
    expect(result.current.canContinueToMerge).toBe(false);
  });

  it("transitions to step 2 on sendHandshake", () => {
    const { result } = renderHook(() => useOutpaintWorkflow());

    act(() => {
      result.current.sendHandshake();
    });

    expect(result.current.state.currentStep).toBe(2);
    expect(result.current.state.handshakeSent).toBe(true);
    expect(result.current.state.handshakeCollapsed).toBe(true);
    expect(result.current.canContinueToMerge).toBe(true);
    expect(vi.mocked(track)).toHaveBeenCalledWith("outpaint_handshake_sent");
  });

  it("toggles handshake collapse", () => {
    const { result } = renderHook(() => useOutpaintWorkflow());

    act(() => {
      result.current.sendHandshake();
    });

    expect(result.current.state.handshakeCollapsed).toBe(true);

    act(() => {
      result.current.toggleHandshakeCollapse();
    });

    expect(result.current.state.handshakeCollapsed).toBe(false);
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() => useOutpaintWorkflow());

    act(() => {
      result.current.sendHandshake();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.handshakeSent).toBe(false);
    expect(result.current.canContinueToMerge).toBe(false);
  });
});
