import { sharpenPixelData, analyzeGuideData } from "./image-processing";
import type { GuideAnalysis } from "./merger-utils";

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
    };

export type WorkerResponse =
  | { type: "SHARPEN"; id: number; pixels: Uint8ClampedArray }
  | { type: "ANALYZE_GUIDE"; id: number; result: GuideAnalysis | null };

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
  }
}

/* v8 ignore start */
if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const response = handleMessage(e.data);
    if (response.type === "SHARPEN") {
      self.postMessage(response, [response.pixels.buffer] as never);
    } else {
      self.postMessage(response);
    }
  };
}
/* v8 ignore stop */
