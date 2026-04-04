import { describe, it, expect } from "vitest";
import { parseMana, getManaPipColor } from "@/lib/mana-utils";

describe("parseMana", () => {
  it("splits a multi-pip mana cost into individual pip strings", () => {
    // Given
    const cost = "{2}{W}{U}";

    // When
    const result = parseMana(cost);

    // Then
    expect(result).toEqual(["{2}", "{W}", "{U}"]);
  });

  it("returns a single-element array for a single pip", () => {
    // Given
    const cost = "{R}";

    // When
    const result = parseMana(cost);

    // Then
    expect(result).toEqual(["{R}"]);
  });

  it("returns an empty array for an empty string", () => {
    // Given / When
    const result = parseMana("");

    // Then
    expect(result).toEqual([]);
  });

  it("returns an empty array when cost is undefined", () => {
    // Given / When
    const result = parseMana(undefined);

    // Then
    expect(result).toEqual([]);
  });

  it("parses hybrid and X pips correctly", () => {
    // Given
    const cost = "{X}{G}{G}";

    // When
    const result = parseMana(cost);

    // Then
    expect(result).toEqual(["{X}", "{G}", "{G}"]);
  });
});

describe("getManaPipColor", () => {
  it("returns white for {W}", () => {
    expect(getManaPipColor("{W}")).toBe("#fdfeff");
  });

  it("returns blue for {U}", () => {
    expect(getManaPipColor("{U}")).toBe("#0175be");
  });

  it("returns dark for {B}", () => {
    expect(getManaPipColor("{B}")).toBe("#272624");
  });

  it("returns red for {R}", () => {
    expect(getManaPipColor("{R}")).toBe("#ef3828");
  });

  it("returns green for {G}", () => {
    expect(getManaPipColor("{G}")).toBe("#027b44");
  });

  it("returns grey for {C} (colorless)", () => {
    expect(getManaPipColor("{C}")).toBe("#c0bfbd");
  });

  it("returns generic grey for numeric pips like {2}", () => {
    expect(getManaPipColor("{2}")).toBe("#aaaaaa");
  });

  it("returns generic grey for {X}", () => {
    expect(getManaPipColor("{X}")).toBe("#aaaaaa");
  });
});
