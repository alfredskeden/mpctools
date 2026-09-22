import { describe, it, expect, vi } from "vitest";
import { padBatchFiles, type DecodedImage } from "./padder-batch";
import { PAD_TARGETS } from "./padder-math";
import type { PadImage } from "./padder-renderer";

const TARGET = PAD_TARGETS[0];

function makeFile(name: string): File {
  return new File(["x"], name, { type: "image/png" });
}

const fakeImage = { width: 0, height: 0 } as unknown as PadImage;

/** Decode that maps a file name to fixed dimensions, tracking releases. */
function decoderFor(dims: Record<string, { width: number; height: number }>) {
  const releases: string[] = [];
  const decodeImage = (file: File): Promise<DecodedImage> => {
    const size = dims[file.name];
    return Promise.resolve({
      image: fakeImage,
      width: size.width,
      height: size.height,
      release: () => releases.push(file.name),
    });
  };
  return { decodeImage, releases };
}

function renderOk(): Promise<Blob | null> {
  return Promise.resolve(new Blob(["png"]));
}

describe("padBatchFiles", () => {
  it("pads every portrait scan in order and names each entry", async () => {
    // Given
    const files = [makeFile("a.png"), makeFile("b.png")];
    const { decodeImage } = decoderFor({
      "a.png": { width: 745, height: 1040 },
      "b.png": { width: 745, height: 1040 },
    });

    // When
    const { entries, failures } = await padBatchFiles(files, TARGET, {
      decodeImage,
      renderBlob: renderOk,
    });

    // Then
    expect(entries.map((e) => e.name)).toEqual(["padded_a.png", "padded_b.png"]);
    expect(failures).toEqual([]);
  });

  it("reports progress and streams a result per file", async () => {
    // Given
    const files = [makeFile("a.png"), makeFile("b.png")];
    const { decodeImage } = decoderFor({
      "a.png": { width: 745, height: 1040 },
      "b.png": { width: 745, height: 1040 },
    });
    const onProgress = vi.fn();
    const onResult = vi.fn();

    // When
    await padBatchFiles(files, TARGET, {
      decodeImage,
      renderBlob: renderOk,
      onProgress,
      onResult,
    });

    // Then
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith({
      processed: 2,
      total: 2,
      current: "b.png",
    });
  });

  it("lists a non-portrait scan as failed but keeps padding the rest", async () => {
    // Given
    const files = [makeFile("wide.png"), makeFile("ok.png")];
    const { decodeImage } = decoderFor({
      "wide.png": { width: 1040, height: 745 },
      "ok.png": { width: 745, height: 1040 },
    });

    // When
    const { entries, failures } = await padBatchFiles(files, TARGET, {
      decodeImage,
      renderBlob: renderOk,
    });

    // Then
    expect(entries.map((e) => e.name)).toEqual(["padded_ok.png"]);
    expect(failures).toEqual([
      { status: "failed", name: "wide.png", reason: "not-portrait" },
    ]);
  });

  it("classifies a scan whose decode rejects as a decode failure", async () => {
    // Given
    const files = [makeFile("broken.png")];
    const decodeImage = () => Promise.reject(new Error("bad"));

    // When
    const { entries, failures } = await padBatchFiles(files, TARGET, {
      decodeImage,
      renderBlob: renderOk,
    });

    // Then
    expect(entries).toEqual([]);
    expect(failures).toEqual([
      { status: "failed", name: "broken.png", reason: "decode" },
    ]);
  });

  it("classifies a null render as a render failure", async () => {
    // Given
    const files = [makeFile("a.png")];
    const { decodeImage } = decoderFor({ "a.png": { width: 745, height: 1040 } });

    // When
    const { failures } = await padBatchFiles(files, TARGET, {
      decodeImage,
      renderBlob: () => Promise.resolve(null),
    });

    // Then
    expect(failures).toEqual([
      { status: "failed", name: "a.png", reason: "render" },
    ]);
  });

  it("releases every decoded image, including failed ones", async () => {
    // Given
    const files = [makeFile("wide.png"), makeFile("ok.png")];
    const { decodeImage, releases } = decoderFor({
      "wide.png": { width: 1040, height: 745 },
      "ok.png": { width: 745, height: 1040 },
    });

    // When
    await padBatchFiles(files, TARGET, { decodeImage, renderBlob: renderOk });

    // Then
    expect(releases).toEqual(["wide.png", "ok.png"]);
  });

  it("stops between files when cancelled and leaves the rest unprocessed", async () => {
    // Given
    const files = [makeFile("a.png"), makeFile("b.png")];
    const decoded: string[] = [];
    const { decodeImage } = decoderFor({
      "a.png": { width: 745, height: 1040 },
      "b.png": { width: 745, height: 1040 },
    });
    const trackingDecode = (file: File) => {
      decoded.push(file.name);
      return decodeImage(file);
    };
    let processed = 0;
    const isCancelled = () => processed++ >= 1; // allow first, cancel before second

    // When
    const { entries } = await padBatchFiles(files, TARGET, {
      decodeImage: trackingDecode,
      renderBlob: renderOk,
      isCancelled,
    });

    // Then
    expect(decoded).toEqual(["a.png"]);
    expect(entries.map((e) => e.name)).toEqual(["padded_a.png"]);
  });
});
