import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const downloadZipMock = vi.fn();
vi.mock("client-zip", () => ({
  downloadZip: (...args: unknown[]) => downloadZipMock(...args),
}));

import {
  dedupeEntryNames,
  buildZipBlob,
  downloadZipBlob,
  type ZipEntry,
} from "./zip-download";

function entry(name: string): ZipEntry {
  return { name, input: new Blob([name]) };
}

describe("dedupeEntryNames", () => {
  it("leaves a unique set of names untouched", () => {
    // Given
    const entries = [entry("a.png"), entry("b.png")];

    // When
    const result = dedupeEntryNames(entries);

    // Then
    expect(result.map((e) => e.name)).toEqual(["a.png", "b.png"]);
  });

  it("suffixes repeated names before the extension", () => {
    // Given
    const entries = [entry("card.png"), entry("card.png"), entry("card.png")];

    // When
    const result = dedupeEntryNames(entries);

    // Then
    expect(result.map((e) => e.name)).toEqual([
      "card.png",
      "card-2.png",
      "card-3.png",
    ]);
  });

  it("suffixes a name that has no extension", () => {
    // Given
    const entries = [entry("scan"), entry("scan")];

    // When
    const result = dedupeEntryNames(entries);

    // Then
    expect(result.map((e) => e.name)).toEqual(["scan", "scan-2"]);
  });

  it("suffixes a dotfile-style name at the end", () => {
    // Given — leading dot only: no real extension boundary.
    const entries = [entry(".env"), entry(".env")];

    // When
    const result = dedupeEntryNames(entries);

    // Then
    expect(result.map((e) => e.name)).toEqual([".env", ".env-2"]);
  });
});

describe("buildZipBlob", () => {
  beforeEach(() => {
    downloadZipMock.mockReset();
  });

  it("de-duplicates names and returns the client-zip blob", async () => {
    // Given
    const zipBlob = new Blob(["zip"]);
    downloadZipMock.mockReturnValue({ blob: () => Promise.resolve(zipBlob) });

    // When
    const result = await buildZipBlob([entry("card.png"), entry("card.png")]);

    // Then
    const passed = downloadZipMock.mock.calls[0][0] as ZipEntry[];
    expect(passed.map((e) => e.name)).toEqual(["card.png", "card-2.png"]);
    expect(result).toBe(zipBlob);
  });
});

describe("downloadZipBlob", () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:zip"),
      revokeObjectURL: vi.fn(),
    });
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clickSpy.mockRestore();
  });

  it("triggers an anchor download with the given name and revokes the url", () => {
    // Given
    const blob = new Blob(["zip"]);

    // When
    downloadZipBlob(blob, "padded-scans.zip");

    // Then
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:zip");
  });
});
