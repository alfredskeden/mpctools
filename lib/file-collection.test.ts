import { describe, it, expect } from "vitest";
import { collectImageFiles, collectDroppedFiles, isImageFile } from "./file-collection";

function makeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

function fileListOf(...files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
  } as unknown as FileList;
}

type FakeEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (cb: (f: File) => void) => void;
  createReader?: () => { readEntries: (cb: (e: FakeEntry[]) => void) => void };
};

function fileEntry(file: File): FakeEntry {
  return { isFile: true, isDirectory: false, file: (cb) => cb(file) };
}

function dirEntry(children: FakeEntry[]): FakeEntry {
  let served = false;
  return {
    isFile: false,
    isDirectory: true,
    createReader: () => ({
      readEntries: (cb) => {
        // Drain: first call yields children, second yields empty.
        if (served) {
          cb([]);
          return;
        }
        served = true;
        cb(children);
      },
    }),
  };
}

function dataTransferOf(
  entries: Array<FakeEntry | null> | undefined,
  files: File[] = [],
): DataTransfer {
  const items =
    entries === undefined
      ? undefined
      : entries.map((entry) => ({ webkitGetAsEntry: () => entry }));
  return {
    items: items as unknown as DataTransferItemList,
    files: fileListOf(...files),
  } as unknown as DataTransfer;
}

describe("collectImageFiles", () => {
  it("returns an empty array for an empty file list", () => {
    // Given
    const list = fileListOf();

    // When
    const result = collectImageFiles(list);

    // Then
    expect(result).toEqual([]);
  });

  it("returns an empty array for a null file list", () => {
    // Given / When
    const result = collectImageFiles(null);

    // Then
    expect(result).toEqual([]);
  });

  it("returns a single image file", () => {
    // Given
    const png = makeFile("card.png", "image/png");

    // When
    const result = collectImageFiles(fileListOf(png));

    // Then
    expect(result).toEqual([png]);
  });

  it("returns every image file from a list of many", () => {
    // Given
    const a = makeFile("a.png", "image/png");
    const b = makeFile("b.png", "image/png");

    // When
    const result = collectImageFiles(fileListOf(a, b));

    // Then
    expect(result).toEqual([a, b]);
  });

  it("filters out files that are not images", () => {
    // Given
    const png = makeFile("card.png", "image/png");
    const junk = makeFile(".DS_Store", "");

    // When
    const result = collectImageFiles(fileListOf(png, junk));

    // Then
    expect(result).toEqual([png]);
  });
});

describe("isImageFile", () => {
  it("is true for an image type and false otherwise", () => {
    // Given / When / Then
    expect(isImageFile(makeFile("a.png", "image/png"))).toBe(true);
    expect(isImageFile(makeFile("a.txt", "text/plain"))).toBe(false);
  });
});

describe("collectDroppedFiles", () => {
  it("returns an empty array when there are no items", async () => {
    // Given
    const dt = dataTransferOf(undefined);

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([]);
  });

  it("returns a dropped image file from a file entry", async () => {
    // Given — one file entry plus an item that yields no entry at all.
    const png = makeFile("card.png", "image/png");
    const dt = dataTransferOf([fileEntry(png), null]);

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([png]);
  });

  it("walks a dropped directory and returns its image files", async () => {
    // Given
    const png = makeFile("card.png", "image/png");
    const dt = dataTransferOf([dirEntry([fileEntry(png)])]);

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([png]);
  });

  it("walks nested directories recursively", async () => {
    // Given
    const deep = makeFile("deep.png", "image/png");
    const dt = dataTransferOf([dirEntry([dirEntry([fileEntry(deep)])])]);

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([deep]);
  });

  it("filters out non-image files from a dropped directory", async () => {
    // Given
    const png = makeFile("card.png", "image/png");
    const junk = makeFile("Thumbs.db", "application/octet-stream");
    const dt = dataTransferOf([dirEntry([fileEntry(png), fileEntry(junk)])]);

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([png]);
  });

  it("falls back to dataTransfer.files when entries are unavailable", async () => {
    // Given — an item with no webkitGetAsEntry, and a flat file list.
    const png = makeFile("card.png", "image/png");
    const dt = {
      items: [{}] as unknown as DataTransferItemList,
      files: fileListOf(png, makeFile("x.txt", "text/plain")),
    } as unknown as DataTransfer;

    // When
    const result = await collectDroppedFiles(dt);

    // Then
    expect(result).toEqual([png]);
  });
});
