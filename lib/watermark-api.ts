export type WatermarkMetadata = {
  corner: string;
  confidence: number;
  alphaGain: number;
  source: string;
};

export type WatermarkResult = {
  blob: Blob;
  metadata: WatermarkMetadata;
};

export class WatermarkApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "WatermarkApiError";
    this.status = status;
  }
}

export async function removeWatermark(
  file: File,
  signal?: AbortSignal,
): Promise<WatermarkResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/watermark-remove", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new WatermarkApiError(response.status, text);
  }

  const blob = await response.blob();
  const headers = response.headers;

  return {
    blob,
    metadata: {
      corner: headers.get("x-detection-corner") ?? "",
      confidence: Number(headers.get("x-detection-confidence")) || 0,
      alphaGain: Number(headers.get("x-detection-alpha-gain")) || 0,
      source: headers.get("x-detection-source") ?? "",
    },
  };
}
