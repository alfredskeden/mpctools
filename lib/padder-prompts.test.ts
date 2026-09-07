import {
  PADDER_TARGET_KEY,
  DEFAULT_PADDER_TARGET,
  buildPadderHandshakePrompt,
  buildPadderCommand,
  PADDER_HANDSHAKE_PROMPT,
  PADDER_COMMAND,
  PADDER_ALTERNATE_COMMAND,
  readStoredPadderTarget,
} from "./padder-prompts";
import { BLEED_REFERENCE, PAD_TARGETS } from "./padder-math";

describe("PADDER_TARGET_KEY", () => {
  it("does not collide with the prep canvas size key", () => {
    // Given / When / Then
    expect(PADDER_TARGET_KEY).not.toBe("prep-canvas-size");
  });
});

describe("DEFAULT_PADDER_TARGET", () => {
  it("describes the 300 DPI MPC default tier", () => {
    // Given / When / Then
    expect(DEFAULT_PADDER_TARGET).toEqual({
      width: BLEED_REFERENCE.width,
      height: BLEED_REFERENCE.height,
      ratioLabel: PAD_TARGETS[0].ratioLabel,
    });
  });
});

describe("buildPadderHandshakePrompt", () => {
  it("substitutes the selected aspect ratio", () => {
    // Given / When
    const prompt = buildPadderHandshakePrompt({
      width: 816,
      height: 1013,
      ratioLabel: "29:36",
    });

    // Then
    expect(prompt).toContain("29:36");
    expect(prompt).not.toContain("11:15");
  });

  it("uses the declared ratio label rather than a reduced one", () => {
    // Given / When
    const prompt = buildPadderHandshakePrompt({
      width: 816,
      height: 1110,
      ratioLabel: "11:15",
    });

    // Then
    expect(prompt).toContain("11:15");
    expect(prompt).not.toContain("136:185");
  });
});

describe("PADDER_HANDSHAKE_PROMPT", () => {
  it("is the prompt for the default target", () => {
    // Given / When / Then
    expect(PADDER_HANDSHAKE_PROMPT).toBe(
      buildPadderHandshakePrompt(DEFAULT_PADDER_TARGET),
    );
  });
});

describe("buildPadderCommand", () => {
  it("substitutes the selected aspect ratio", () => {
    // Given / When
    const command = buildPadderCommand({
      width: 816,
      height: 1013,
      ratioLabel: "29:36",
    });

    // Then
    expect(command).toContain("29:36");
    expect(command).not.toContain("11:15");
  });
});

describe("PADDER_COMMAND", () => {
  it("is the command for the default target", () => {
    // Given / When / Then
    expect(PADDER_COMMAND).toBe(buildPadderCommand(DEFAULT_PADDER_TARGET));
  });
});

describe("PADDER_ALTERNATE_COMMAND", () => {
  it("carries no aspect ratio of its own", () => {
    // Given / When / Then
    expect(PADDER_ALTERNATE_COMMAND.length).toBeGreaterThan(0);
    expect(PADDER_ALTERNATE_COMMAND).not.toContain("11:15");
  });
});

describe("readStoredPadderTarget", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns the stored target when present", () => {
    // Given
    const target = { width: 1632, height: 2026, ratioLabel: "29:36" };
    sessionStorage.setItem(PADDER_TARGET_KEY, JSON.stringify(target));

    // When
    const stored = readStoredPadderTarget();

    // Then
    expect(stored).toEqual(target);
  });

  it("falls back to the default target when storage is empty", () => {
    // Given / When
    const stored = readStoredPadderTarget();

    // Then
    expect(stored).toEqual(DEFAULT_PADDER_TARGET);
  });

  it("falls back to the default target when the stored value is unparsable", () => {
    // Given
    sessionStorage.setItem(PADDER_TARGET_KEY, "{not json");

    // When
    const stored = readStoredPadderTarget();

    // Then
    expect(stored).toEqual(DEFAULT_PADDER_TARGET);
  });

  it("falls back to the default target when the stored value lacks dimensions", () => {
    // Given
    sessionStorage.setItem(PADDER_TARGET_KEY, JSON.stringify({ foo: "bar" }));

    // When
    const stored = readStoredPadderTarget();

    // Then
    expect(stored).toEqual(DEFAULT_PADDER_TARGET);
  });
});
