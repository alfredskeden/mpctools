"use client";

type ForeignObjectData = {
  x: number;
  y: number;
  width: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  padding: number;
  lineHeight: number;
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function extractBgUrl(style: CSSStyleDeclaration): string | null {
  const match = style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
  return match ? match[1] : null;
}

/**
 * Removes all <foreignObject> elements from the SVG clone and returns their
 * text content and layout data so it can be redrawn via canvas API.
 * This prevents the "tainted canvas" SecurityError caused by foreignObject.
 */
function extractForeignObjects(svgClone: SVGSVGElement): ForeignObjectData[] {
  const result: ForeignObjectData[] = [];
  const foreignObjects = svgClone.querySelectorAll("foreignObject");

  foreignObjects.forEach((fo) => {
    const x = parseFloat(fo.getAttribute("x") ?? "0");
    const y = parseFloat(fo.getAttribute("y") ?? "0");
    const width = parseFloat(fo.getAttribute("width") ?? "0");
    const div = fo.querySelector("div");
    const text = (div ?? fo).textContent ?? "";
    const style = div?.style;
    const fontSize = parseFloat(style?.fontSize ?? "80") || 80;
    const padding = parseFloat(style?.padding ?? "40") || 40;
    const lineHeightRaw = style?.lineHeight ?? "1.4";
    const lineHeight = parseFloat(lineHeightRaw) || 1.4;

    result.push({
      x,
      y,
      width,
      text,
      fontSize,
      fontFamily: style?.fontFamily ?? "serif",
      color: style?.color ?? "#ffffff",
      padding,
      lineHeight,
    });

    fo.remove();
  });

  return result;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  { x, y, width, text, fontSize, fontFamily, color, padding, lineHeight }: ForeignObjectData,
): void {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  const textX = x + padding;
  const maxWidth = width - padding * 2;
  const lineHeightPx = fontSize * lineHeight;
  let currentY = y + padding;

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        ctx.fillText(line, textX, currentY);
        line = word;
        currentY += lineHeightPx;
      } else {
        line = candidate;
      }
    }
    if (line) {
      ctx.fillText(line, textX, currentY);
      currentY += lineHeightPx;
    }
  }
}

export function useSvgToPng() {
  const downloadAsPng = async (
    svgId: string,
    filename: string,
  ): Promise<void> => {
    const svgElement = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svgElement) return;

    const viewBox = svgElement.viewBox?.baseVal;
    const width = viewBox?.width || svgElement.clientWidth;
    const height = viewBox?.height || svgElement.clientHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const bgUrl = extractBgUrl(svgElement.style);
    if (bgUrl) {
      try {
        const img = await loadImage(bgUrl);
        ctx.drawImage(img, 0, 0, width, height);
      } catch {
        // Continue without background image
      }
    }

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.style.backgroundImage = "";
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    // Strip foreignObject elements before serializing to avoid tainting the canvas
    const foreignObjects = extractForeignObjects(clone);

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const img = await loadImage(svgUrl);
      ctx.drawImage(img, 0, 0, width, height);
    } catch {
      // Continue with partial render
    } finally {
      URL.revokeObjectURL(svgUrl);
    }

    // Redraw foreignObject text content directly onto canvas
    for (const foData of foreignObjects) {
      drawWrappedText(ctx, foData);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, "image/png");
  };

  return { downloadAsPng };
}
