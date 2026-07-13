import { runWatermarkPipeline } from "@/lib/watermark-pipeline";
import type { WatermarkCorner, WatermarkVariant } from "@/lib/watermark-detection";

export const runtime = "nodejs";

function hasValidApiSecret(request: Request): boolean {
  const secret = process.env.WATERMARK_API_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  if (!authorization) return false;
  return authorization === `Bearer ${secret}`;
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
  if (!hasValidApiSecret(request)) {
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

  const adaptive = parseBoolField(formData, "adaptive", false);
  const cornerField = formData.get("corner") as WatermarkCorner | "auto" | null;
  const forcedVariantField = formData.get("forcedVariant") as WatermarkVariant | null;

  const options = {
    adaptive,
    corner: cornerField ?? undefined,
    forcedVariant: forcedVariantField ?? undefined,
    alphaGain: parseFloatField(formData, "alphaGain"),
  };

  let output: Awaited<ReturnType<typeof runWatermarkPipeline>>;
  try {
    output = await runWatermarkPipeline(imageBuffer, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline error";
    if (message.includes("decode") || message.includes("unsupported") || message.includes("Input")) {
      return new Response("Failed to decode image", { status: 422 });
    }
    return new Response("Failed to process image", { status: 500 });
  }

  const headers = new Headers({
    "Content-Type": "image/png",
    "x-detection-corner": output.corner,
    "x-detection-confidence": String(output.confidence),
    "x-detection-alpha-gain": String(output.alphaGain),
    "x-detection-source": output.source,
    "x-detection-accepted": String(output.accepted),
  });

  return new Response(Buffer.from(output.pngBytes), { headers });
}
