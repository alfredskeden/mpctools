import { computePadLayout } from "./padder-math";
import { exportPaddedCanvas, paddedFileName } from "./padder-renderer";
import type { PadImage } from "./padder-renderer";
import type { PadLayout, PadTarget } from "./padder-math";
import type { ZipEntry } from "./zip-download";

export type BatchFailureReason = "decode" | "not-portrait" | "render";

export type BatchSuccess = {
  status: "success";
  name: string;
  layout: PadLayout;
  blob: Blob;
};

export type BatchFailure = {
  status: "failed";
  name: string;
  reason: BatchFailureReason;
};

export type BatchResult = BatchSuccess | BatchFailure;

/** A decoded scan plus the means to release the memory backing it. */
export type DecodedImage = {
  image: PadImage;
  width: number;
  height: number;
  release: () => void;
};

export type PadBatchProgress = {
  processed: number;
  total: number;
  current: string;
};

export type PadBatchOptions = {
  onProgress?: (progress: PadBatchProgress) => void;
  onResult?: (result: BatchResult, index: number) => void;
  /** Checked before each file; a true return stops the run between files. */
  isCancelled?: () => boolean;
  /** Injected for testing; the default decodes via an object URL + `Image`. */
  decodeImage?: (file: File) => Promise<DecodedImage>;
  /** Injected for testing; the default renders offscreen and `toBlob`s a PNG. */
  renderBlob?: (image: PadImage, layout: PadLayout) => Promise<Blob | null>;
};

export type PadBatchOutcome = {
  entries: ZipEntry[];
  failures: BatchFailure[];
};

/**
 * Pad every file in order, one decoded image in memory at a time. Successes
 * become ZIP entries; failures are classified and collected. Each file is
 * streamed through `onResult`/`onProgress` as it completes, and the run can be
 * cancelled between files.
 */
export async function padBatchFiles(
  files: File[],
  target: PadTarget,
  options: PadBatchOptions = {},
): Promise<PadBatchOutcome> {
  const {
    onProgress,
    onResult,
    isCancelled = () => false,
    decodeImage = defaultDecodeImage,
    renderBlob = defaultRenderBlob,
  } = options;

  const entries: ZipEntry[] = [];
  const failures: BatchFailure[] = [];
  const total = files.length;

  for (let index = 0; index < total; index++) {
    if (isCancelled()) break;

    const file = files[index];
    const result = await processFile(file, target, decodeImage, renderBlob);

    if (result.status === "success") {
      entries.push({ name: paddedFileName(result.name), input: result.blob });
    } else {
      failures.push(result);
    }

    onResult?.(result, index);
    onProgress?.({ processed: index + 1, total, current: file.name });
  }

  return { entries, failures };
}

async function processFile(
  file: File,
  target: PadTarget,
  decodeImage: NonNullable<PadBatchOptions["decodeImage"]>,
  renderBlob: NonNullable<PadBatchOptions["renderBlob"]>,
): Promise<BatchResult> {
  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    return { status: "failed", name: file.name, reason: "decode" };
  }

  try {
    const layout = computePadLayout(
      { width: decoded.width, height: decoded.height },
      target,
    );
    if (!layout) {
      return { status: "failed", name: file.name, reason: "not-portrait" };
    }

    const blob = await renderBlob(decoded.image, layout);
    if (!blob) {
      return { status: "failed", name: file.name, reason: "render" };
    }

    return { status: "success", name: file.name, layout, blob };
  } finally {
    decoded.release();
  }
}

/* v8 ignore start -- browser-only decode/render glue, injected in tests */
function defaultDecodeImage(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    image.src = url;
  });
}

function defaultRenderBlob(
  image: PadImage,
  layout: PadLayout,
): Promise<Blob | null> {
  const canvas = exportPaddedCanvas(image, layout);
  if (!canvas) return Promise.resolve(null);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
/* v8 ignore stop */
