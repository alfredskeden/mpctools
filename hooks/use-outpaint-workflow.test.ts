import { renderHook, act } from "@testing-library/react";
import {
  outpaintReducer,
  useOutpaintWorkflow,
  HANDSHAKE_PROMPT,
  OUTPAINT_COMMAND,
} from "./use-outpaint-workflow";
import type { OutpaintState } from "./use-outpaint-workflow";

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

describe("prompt constants", () => {
  it("exports HANDSHAKE_PROMPT", () => {
    expect(HANDSHAKE_PROMPT).toContain("High-Fidelity Neutral Photo Extender");
  });

  it("exports OUTPAINT_COMMAND", () => {
    expect(OUTPAINT_COMMAND).toContain("NEW PROJECT / MEMORY FLUSH");
  });
});

describe("useOutpaintWorkflow", () => {
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
