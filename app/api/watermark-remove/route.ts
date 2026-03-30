import sharp from "sharp";
import { detectBestCandidate } from "@/lib/watermark-detection";
import { runPipeline } from "@/lib/watermark-removal";
import type { RemovalSettings } from "@/lib/watermark-removal";
import type { WatermarkCorner, WatermarkVariant } from "@/lib/watermark-detection";
import type { RawImageData } from "@/lib/watermark-math";

export const runtime = "nodejs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  return origin.includes(host);
}

function parseFloatField(formData: FormData, name: string): number | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? undefined : parsed;
}

function parseBoolField(formData: FormData, name: string, fallback: boolean): boolean {
  const value = formData.get(name);
  if (value === null) return fallback;
  return String(value).toLowerCase() !== "false";
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const imageField = formData.get("image");
  if (imageField === null || typeof imageField === "string") {
    return new Response("Missing or invalid image field", { status: 400 });
  }

  let imageBuffer: Buffer;
  try {
    const arrayBuffer = await imageField.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } catch {
    return new Response("Failed to read image data", { status: 400 });
  }

  let rawPixels: Buffer;
  let imgWidth: number;
  let imgHeight: number;
  try {
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    rawPixels = data;
    imgWidth = info.width;
    imgHeight = info.height;
  } catch {
    return new Response("Failed to decode image", { status: 422 });
  }

  const adaptive = parseBoolField(formData, "adaptive", false);
  const cornerField = formData.get("corner") as WatermarkCorner | "auto" | null;
  const forcedVariantField = formData.get("forcedVariant") as WatermarkVariant | null;

  const settings: RemovalSettings = {
    feather: parseFloatField(formData, "feather") ?? 4,
    postLightness: parseFloatField(formData, "postLightness") ?? 2.75,
    maskExpand: parseFloatField(formData, "maskExpand") ?? 1.5,
  };

  if (cornerField) settings.corner = cornerField;

  const alphaGain = parseFloatField(formData, "alphaGain");
  if (alphaGain !== undefined) settings.alphaGain = alphaGain;

  const edgeReveal = parseFloatField(formData, "edgeReveal");
  if (edgeReveal !== undefined) settings.edgeReveal = edgeReveal;

  const innerPunch = parseFloatField(formData, "innerPunch");
  if (innerPunch !== undefined) settings.innerPunch = innerPunch;

  const img: RawImageData = {
    data: new Uint8ClampedArray(rawPixels),
    width: imgWidth,
    height: imgHeight,
  };

  const detection = adaptive
    ? detectBestCandidate(img, {
        forcedVariant: forcedVariantField ?? undefined,
        corner: cornerField ?? "auto",
      })
    : null;

  const result = runPipeline(img, settings, detection);

  let pngBuffer: Buffer;
  try {
    pngBuffer = await sharp(Buffer.from(result.imageData.data), {
      raw: { width: result.imageData.width, height: result.imageData.height, channels: 4 },
    })
      .png({ compressionLevel: 1 })
      .toBuffer();
  } catch {
    return new Response("Failed to encode image", { status: 500 });
  }

  const headers = new Headers({
    "Content-Type": "image/png",
    "x-detection-corner": result.accepted ? String(detection?.corner ?? "") : "",
    "x-detection-confidence": String(result.confidence),
    "x-detection-alpha-gain": String(result.alphaGain),
    "x-detection-source": result.detectionSource,
    "x-detection-accepted": String(result.accepted),
  });

  return new Response(new Uint8Array(pngBuffer), { headers });
}
