import { writePsd } from "ag-psd";
import { generateCombinedMask } from "@/lib/merger-utils";

export type PsdExportParams = {
  ogImage: HTMLImageElement;
  outpaintImage: HTMLImageElement;
  ogPosition: { x: number; y: number; w: number; h: number };
  canvasW: number;
  canvasH: number;
  featherStrength: number;
  irregMagnitude: number;
  irregRadius: number;
  irregDensity: number;
  irregSeed: number;
  irregBlur: number;
};

function convertAlphaToLuminance(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  const srcCtx = source.getContext("2d")!;
  const imageData = srcCtx.getImageData(0, 0, source.width, source.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    data[i] = alpha;
    data[i + 1] = alpha;
    data[i + 2] = alpha;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function buildPsdBuffer(params: PsdExportParams): ArrayBuffer {
  const {
    ogImage,
    outpaintImage,
    ogPosition,
    canvasW,
    canvasH,
    featherStrength,
    irregMagnitude,
    irregRadius,
    irregDensity,
    irregSeed,
    irregBlur,
  } = params;

  const ogCanvas = document.createElement("canvas");
  ogCanvas.width = ogPosition.w;
  ogCanvas.height = ogPosition.h;
  const ogCtx = ogCanvas.getContext("2d")!;
  ogCtx.drawImage(ogImage, 0, 0, ogPosition.w, ogPosition.h);

  const rawMask = generateCombinedMask(
    ogPosition.w,
    ogPosition.h,
    featherStrength,
    10,
    irregMagnitude,
    irregRadius,
    irregDensity,
    irregSeed,
    irregBlur,
  );
  const maskCanvas = convertAlphaToLuminance(rawMask);

  const outpaintCanvas = document.createElement("canvas");
  outpaintCanvas.width = canvasW;
  outpaintCanvas.height = canvasH;
  const outpaintCtx = outpaintCanvas.getContext("2d")!;
  outpaintCtx.drawImage(outpaintImage, 0, 0, canvasW, canvasH);

  return writePsd({
    width: canvasW,
    height: canvasH,
    children: [
      {
        name: "Artwork",
        children: [
          {
            name: "Outpaint",
            top: 0,
            left: 0,
            bottom: canvasH,
            right: canvasW,
            canvas: outpaintCanvas,
          },
          {
            name: "OG Image",
            top: ogPosition.y,
            left: ogPosition.x,
            bottom: ogPosition.y + ogPosition.h,
            right: ogPosition.x + ogPosition.w,
            canvas: ogCanvas,
            mask: {
              top: ogPosition.y,
              left: ogPosition.x,
              bottom: ogPosition.y + ogPosition.h,
              right: ogPosition.x + ogPosition.w,
              canvas: maskCanvas,
            },
          },
        ],
      },
    ],
  });
}

export function downloadPsd(params: PsdExportParams, filename: string): void {
  const buffer = buildPsdBuffer(params);
  const blob = new Blob([buffer], { type: "image/vnd.adobe.photoshop" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
