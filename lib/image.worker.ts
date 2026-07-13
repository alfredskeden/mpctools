import { sharpenPixelData, analyzeGuideData } from "./image-processing";
import { detectBestCandidate } from "./watermark-detection";
import { runPipeline, type RemovalSettings } from "./watermark-removal";
import type { GuideAnalysis } from "./merger-utils";

const DEFAULT_REMOVAL_SETTINGS: RemovalSettings = {};

export type WatermarkWorkerMetadata = {
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
};

export type WorkerMessage =
  | {
      type: "SHARPEN";
      id: number;
      pixels: Uint8ClampedArray;
      width: number;
      height: number;
      amount: number;
      radius: number;
    }
  | {
      type: "ANALYZE_GUIDE";
      id: number;
      data: Uint8ClampedArray;
      width: number;
      height: number;
      ogWidth: number;
      ogHeight: number;
    }
  | {
      type: "REMOVE_WATERMARK";
      id: number;
      pixels: Uint8ClampedArray;
      width: number;
      height: number;
      adaptive?: boolean;
      settings?: RemovalSettings;
      confidenceThreshold?: number;
    };

export type WorkerResponse =
  | { type: "SHARPEN"; id: number; pixels: Uint8ClampedArray }
  | { type: "ANALYZE_GUIDE"; id: number; result: GuideAnalysis | null }
  | {
      type: "REMOVE_WATERMARK";
      id: number;
      pixels: Uint8ClampedArray;
      width: number;
      height: number;
      metadata: WatermarkWorkerMetadata;
    };

export function handleMessage(msg: WorkerMessage): WorkerResponse {
  switch (msg.type) {
    case "SHARPEN": {
      const result = sharpenPixelData(
        msg.pixels,
        msg.width,
        msg.height,
        msg.amount,
        msg.radius,
      );
      return { type: "SHARPEN", id: msg.id, pixels: result };
    }
    case "ANALYZE_GUIDE": {
      const result = analyzeGuideData(
        msg.data,
        msg.width,
        msg.height,
        msg.ogWidth,
        msg.ogHeight,
      );
      return { type: "ANALYZE_GUIDE", id: msg.id, result };
    }
    case "REMOVE_WATERMARK": {
      const img = { data: msg.pixels, width: msg.width, height: msg.height };
      const settings = msg.settings ?? DEFAULT_REMOVAL_SETTINGS;
      let detection = msg.adaptive
        ? detectBestCandidate(img, { corner: settings.corner })
        : null;
      if (
        detection &&
        msg.confidenceThreshold !== undefined &&
        detection.confidence < msg.confidenceThreshold
      ) {
        detection = null;
      }
      const result = runPipeline(img, settings, detection);
      return {
        type: "REMOVE_WATERMARK",
        id: msg.id,
        pixels: result.imageData.data,
        width: result.imageData.width,
        height: result.imageData.height,
        metadata: {
          /* v8 ignore next */
          corner: result.accepted ? String(detection?.corner ?? "") : "",
          confidence: result.confidence,
          alphaGain: result.alphaGain,
          source: result.detectionSource,
        },
      };
    }
  }
}

/* v8 ignore start */
if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const response = handleMessage(e.data);
    if (response.type === "SHARPEN" || response.type === "REMOVE_WATERMARK") {
      self.postMessage(response, [response.pixels.buffer] as never);
    } else {
      self.postMessage(response);
    }
  };
}
/* v8 ignore stop */
