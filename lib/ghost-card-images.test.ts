import { describe, it, expect, vi, afterEach } from "vitest";
import type { Dirent } from "fs";
import {
  getNumericFolders,
  pickTwoDistinct,
  buildImagePaths,
  getGhostCardImageSets,
} from "./ghost-card-images";

const { mockReaddirSync } = vi.hoisted(() => ({
  mockReaddirSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: { readdirSync: mockReaddirSync },
  readdirSync: mockReaddirSync,
}));
vi.mock("path", () => ({
  default: { join: (...parts: string[]) => parts.join("/") },
  join: (...parts: string[]) => parts.join("/"),
}));

function makeDirent(name: string, isDir: boolean): Dirent {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    path: "",
    parentPath: "",
  } as Dirent;
}

afterEach(() => {
  mockReaddirSync.mockReset();
  vi.restoreAllMocks();
});

describe("getNumericFolders", () => {
  it("returns only numeric directory names sorted ascending", () => {
    // Given
    mockReaddirSync.mockReturnValue([
      makeDirent("3", true),
      makeDirent("0", true),
      makeDirent("myra_prepper.webp", false),
      makeDirent("abc", true),
      makeDirent("1", true),
    ]);

    // When
    const result = getNumericFolders("/some/dir");

    // Then
    expect(result).toEqual(["0", "1", "3"]);
  });

  it("returns empty array when no numeric directories exist", () => {
    // Given
    mockReaddirSync.mockReturnValue([
      makeDirent("queen_full_card.webp", false),
      makeDirent("myra", true),
    ]);

    // When
    const result = getNumericFolders("/some/dir");

    // Then
    expect(result).toEqual([]);
  });
});

describe("pickTwoDistinct", () => {
  it("returns ['0','0'] fallback when items is empty", () => {
    // When
    const result = pickTwoDistinct([]);

    // Then
    expect(result).toEqual(["0", "0"]);
  });

  it("returns the same item twice when only one item exists", () => {
    // When
    const result = pickTwoDistinct(["2"]);

    // Then
    expect(result).toEqual(["2", "2"]);
  });

  it("returns two distinct items from a two-item list", () => {
    // Given
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9);

    // When
    const result = pickTwoDistinct(["0", "1"]);

    // Then
    expect(result[0]).not.toBe(result[1]);
    expect(["0", "1"]).toContain(result[0]);
    expect(["0", "1"]).toContain(result[1]);
  });

  it("retries until second pick differs from first", () => {
    // Given — first=0, second attempt=0 (collision), third attempt=2
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99);

    // When
    const result = pickTwoDistinct(["a", "b", "c"]);

    // Then
    expect(result[0]).toBe("a");
    expect(result[1]).toBe("c");
  });
});

describe("buildImagePaths", () => {
  it("returns the three standard image paths for a folder index", () => {
    // When
    const result = buildImagePaths("2");

    // Then
    expect(result).toEqual([
      "/outpaint-animation/2/prepper.webp",
      "/outpaint-animation/2/outpaint.webp",
      "/outpaint-animation/2/full_card.webp",
    ]);
  });
});

describe("getGhostCardImageSets", () => {
  it("returns two distinct image sets from available numeric folders", () => {
    // Given
    mockReaddirSync.mockReturnValue([
      makeDirent("0", true),
      makeDirent("1", true),
      makeDirent("2", true),
    ]);
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.99);

    // When
    const [left, right] = getGhostCardImageSets();

    // Then
    expect(left).toEqual([
      "/outpaint-animation/0/prepper.webp",
      "/outpaint-animation/0/outpaint.webp",
      "/outpaint-animation/0/full_card.webp",
    ]);
    expect(right).toEqual([
      "/outpaint-animation/2/prepper.webp",
      "/outpaint-animation/2/outpaint.webp",
      "/outpaint-animation/2/full_card.webp",
    ]);
  });
});
