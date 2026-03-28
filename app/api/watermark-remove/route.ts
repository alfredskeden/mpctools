// Requires: sharp (pnpm add sharp)
import sharp from "sharp";
import { runPipeline } from "@/lib/watermark-removal";
import { detectBestCandidate } from "@/lib/watermark-detection";
import type { RawImageData } from "@/lib/watermark-math";
import type { RemovalSettings } from "@/lib/watermark-removal";
import type { WatermarkCorner } from "@/lib/watermark-detection";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  return origin.includes(host);
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const imageFile = formData.get("image");
  if (!imageFile || !(imageFile instanceof Blob)) {
    return Response.json({ error: "Missing image field" }, { status: 400 });
  }

  const variant = (formData.get("variant") as string) ?? "auto";
  const cornerRaw = (formData.get("corner") as string) ?? "auto";
  const alphaGainRaw = formData.get("alphaGain");
  const featherRaw = formData.get("feather");
  const lightnessRaw = formData.get("lightness");

  const corner =
    cornerRaw === "auto" ? "auto" : (cornerRaw as WatermarkCorner | "auto");
  const alphaGain = alphaGainRaw ? parseFloat(alphaGainRaw as string) : 1.0;
  const feather = featherRaw ? parseFloat(featherRaw as string) : 4;
  const postLightness = lightnessRaw
    ? parseFloat(lightnessRaw as string)
    : 0;

  let imageBuffer: Buffer;
  try {
    imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  } catch {
    return Response.json({ error: "Failed to read image" }, { status: 400 });
  }

  let rawData: Uint8ClampedArray;
  let width: number;
  let height: number;
  try {
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    rawData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    width = info.width;
    height = info.height;
  } catch {
    return Response.json({ error: "Failed to decode image" }, { status: 422 });
  }

  const img: RawImageData = { data: rawData, width, height };

  const settings: RemovalSettings = {
    corner,
    alphaGain: Number.isFinite(alphaGain) ? alphaGain : 1,
    feather: Number.isFinite(feather) ? feather : 4,
    postLightness: Number.isFinite(postLightness) ? postLightness : 0,
  };

  const wantsAdaptive = variant === "auto" || corner === "auto";
  const detection = wantsAdaptive
    ? detectBestCandidate(img, {
        forcedVariant: variant === "auto" ? undefined : (variant as "48" | "96"),
      })
    : null;

  const result = runPipeline(img, settings, detection);

  let pngBuffer: Buffer;
  try {
    pngBuffer = await sharp(Buffer.from(result.imageData.data.buffer), {
      raw: { width: result.imageData.width, height: result.imageData.height, channels: 4 },
    })
      .png({ compressionLevel: 0 }) // skip zlib compression — faster over loopback
      .toBuffer();
  } catch {
    return Response.json({ error: "Failed to encode output" }, { status: 500 });
  }

  return new Response(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "x-detection-corner": result.accepted ? String(detection?.corner ?? "") : "",
      "x-detection-confidence": String(result.confidence),
      "x-detection-alpha-gain": String(result.alphaGain),
      "x-detection-source": result.detectionSource,
    },
  });
}
