import { sharpenPixelData, analyzeGuideData } from "./image-processing";
import { detectBestCandidate } from "./watermark-detection";
import { runPipeline } from "./watermark-removal";
import type { GuideAnalysis } from "./merger-utils";
import type { WorkerMessage, WorkerResponse, WatermarkWorkerMetadata } from "./image.worker";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (value: WorkerResponse) => void }
>();

/* v8 ignore start */
function getWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./image.worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const entry = pending.get(e.data.id);
        if (entry) {
          pending.delete(e.data.id);
          entry.resolve(e.data);
        }
      };
    } catch {
      return null;
    }
  }
  return worker;
}

function postToWorker(msg: DistributiveOmit<WorkerMessage, "id">, transfer?: Transferable[]): Promise<WorkerResponse> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker unavailable"));

  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    w.postMessage({ ...msg, id }, transfer ?? []);
  });
}
/* v8 ignore stop */

export async function sharpenInWorker(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius: number,
): Promise<Uint8ClampedArray> {
  /* v8 ignore start -- Worker path requires real Web Worker */
  try {
    const copy = new Uint8ClampedArray(pixels);
    const response = await postToWorker(
      { type: "SHARPEN", pixels: copy, width, height, amount, radius },
      [copy.buffer],
    );
    if (response.type === "SHARPEN") return response.pixels;
  } catch {
    // fallback
  }
  /* v8 ignore stop */
  return sharpenPixelData(pixels, width, height, amount, radius);
}

export async function analyzeGuideInWorker(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  ogWidth: number,
  ogHeight: number,
): Promise<GuideAnalysis | null> {
  /* v8 ignore start -- Worker path requires real Web Worker */
  try {
    const copy = new Uint8ClampedArray(data);
    const response = await postToWorker(
      { type: "ANALYZE_GUIDE", data: copy, width, height, ogWidth, ogHeight },
      [copy.buffer],
    );
    if (response.type === "ANALYZE_GUIDE") return response.result;
  } catch {
    // fallback
  }
  /* v8 ignore stop */
  return analyzeGuideData(data, width, height, ogWidth, ogHeight);
}

export type RemoveWatermarkWorkerResult = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  metadata: WatermarkWorkerMetadata;
};

export async function removeWatermarkInWorker(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<RemoveWatermarkWorkerResult> {
  /* v8 ignore start -- Worker path requires real Web Worker */
  try {
    const copy = new Uint8ClampedArray(pixels);
    const response = await postToWorker(
      { type: "REMOVE_WATERMARK", pixels: copy, width, height },
      [copy.buffer],
    );
    if (response.type === "REMOVE_WATERMARK") {
      return {
        pixels: response.pixels,
        width: response.width,
        height: response.height,
        metadata: response.metadata,
      };
    }
  } catch {
    // fallback
  }
  /* v8 ignore stop */
  const img = { data: pixels, width, height };
  const detection = detectBestCandidate(img);
  const result = runPipeline(img, {}, detection);
  return {
    pixels: result.imageData.data,
    width: result.imageData.width,
    height: result.imageData.height,
    metadata: {
      corner: result.accepted ? String(detection?.corner ?? "") : "",
      confidence: result.confidence,
      alphaGain: result.alphaGain,
      source: result.detectionSource,
    },
  };
}
