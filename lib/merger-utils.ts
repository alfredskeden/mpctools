export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFeatherMask(
  w: number,
  h: number,
  feather: number,
  radius: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const inset = feather;

  if (inset * 2 >= w || inset * 2 >= h) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
    return canvas;
  }

  const ix = inset;
  const iy = inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  const r = Math.min(radius, Math.min(iw, ih) / 2);

  ctx.filter = feather > 0 ? `blur(${feather / 2}px)` : "none";
  ctx.fillStyle = "white";

  if (r > 0) {
    ctx.beginPath();
    ctx.roundRect(ix, iy, iw, ih, r);
    ctx.fill();
  } else {
    ctx.fillRect(ix, iy, iw, ih);
  }

  ctx.filter = "none";
  return canvas;
}

export function generateIrregularMask(
  w: number,
  h: number,
  radius: number,
  irregularity: number,
  seed: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const iw = w;
  const ih = h;
  const ix = 0;
  const iy = 0;
  const r = Math.min(radius, Math.min(iw, ih) / 2);

  const rng = mulberry32(seed);
  const step = 8;
  const maxDisp = irregularity * 1.5;

  const perim = 2 * (iw - 2 * r) + 2 * (ih - 2 * r) + 2 * Math.PI * r;
  const nSamples = Math.max(16, Math.ceil(perim / step));
  const noiseVals: number[] = [];
  for (let i = 0; i < nSamples; i++) {
    noiseVals.push((rng() - 0.5) * 2 * maxDisp);
  }
  for (let pass = 0; pass < 2; pass++) {
    const smoothed: number[] = [];
    for (let i = 0; i < nSamples; i++) {
      const prev = noiseVals[(i - 1 + nSamples) % nSamples];
      const curr = noiseVals[i];
      const next = noiseVals[(i + 1) % nSamples];
      smoothed.push((prev + curr * 2 + next) / 4);
    }
    for (let i = 0; i < nSamples; i++) noiseVals[i] = smoothed[i];
  }

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < nSamples; i++) {
    const t = i / nSamples;
    const d = t * perim;
    let px: number, py: number, nx: number, ny: number;

    if (d < iw - 2 * r) {
      px = ix + r + d;
      py = iy;
      nx = 0;
      ny = -1;
    } else if (d < iw - 2 * r + (Math.PI * r) / 2) {
      const arcD = d - (iw - 2 * r);
      const angle = -Math.PI / 2 + arcD / r;
      px = ix + iw - r + Math.cos(angle) * r;
      py = iy + r + Math.sin(angle) * r;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else if (d < iw - 2 * r + (Math.PI * r) / 2 + ih - 2 * r) {
      const edgeD = d - (iw - 2 * r + (Math.PI * r) / 2);
      px = ix + iw;
      py = iy + r + edgeD;
      nx = 1;
      ny = 0;
    } else if (d < iw - 2 * r + Math.PI * r + ih - 2 * r) {
      const arcD = d - (iw - 2 * r + (Math.PI * r) / 2 + ih - 2 * r);
      const angle = 0 + arcD / r;
      px = ix + iw - r + Math.cos(angle) * r;
      py = iy + ih - r + Math.sin(angle) * r;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else if (d < 2 * (iw - 2 * r) + Math.PI * r + ih - 2 * r) {
      const edgeD = d - (iw - 2 * r + Math.PI * r + ih - 2 * r);
      px = ix + iw - r - edgeD;
      py = iy + ih;
      nx = 0;
      ny = 1;
    } else if (d < 2 * (iw - 2 * r) + 1.5 * Math.PI * r + ih - 2 * r) {
      const arcD = d - (2 * (iw - 2 * r) + Math.PI * r + ih - 2 * r);
      const angle = Math.PI / 2 + arcD / r;
      px = ix + r + Math.cos(angle) * r;
      py = iy + ih - r + Math.sin(angle) * r;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else if (d < 2 * (iw - 2 * r) + 1.5 * Math.PI * r + 2 * (ih - 2 * r)) {
      const edgeD = d - (2 * (iw - 2 * r) + 1.5 * Math.PI * r + ih - 2 * r);
      px = ix;
      py = iy + ih - r - edgeD;
      nx = -1;
      ny = 0;
    } else {
      const arcD =
        d - (2 * (iw - 2 * r) + 1.5 * Math.PI * r + 2 * (ih - 2 * r));
      const angle = Math.PI + arcD / r;
      px = ix + r + Math.cos(angle) * r;
      py = iy + r + Math.sin(angle) * r;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    }

    points.push({ x: px + nx * noiseVals[i], y: py + ny * noiseVals[i] });
  }

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();

  return canvas;
}

export function generateCombinedMask(
  w: number,
  h: number,
  feather: number,
  radius: number,
  irregularity: number,
  irregRadius: number,
  irregDensity: number,
  seed: number,
  irregBlur: number,
): HTMLCanvasElement {
  const maskA = generateFeatherMask(w, h, feather, radius);

  if (irregularity <= 0 || irregDensity <= 0) return maskA;

  const maskB = generateIrregularMask(w, h, irregRadius, irregularity, seed);

  if (irregBlur > 0) {
    const bctx = maskB.getContext("2d")!;
    const blurred = document.createElement("canvas");
    blurred.width = w;
    blurred.height = h;
    const blurCtx = blurred.getContext("2d")!;
    blurCtx.filter = `blur(${irregBlur}px)`;
    blurCtx.drawImage(maskB, 0, 0);
    bctx.clearRect(0, 0, w, h);
    bctx.drawImage(blurred, 0, 0);
  }

  if (irregDensity < 100) {
    const bctx = maskB.getContext("2d")!;
    bctx.globalCompositeOperation = "source-over";
    bctx.globalAlpha = 1 - irregDensity / 100;
    bctx.fillStyle = "white";
    bctx.fillRect(0, 0, w, h);
    bctx.globalAlpha = 1.0;
    bctx.globalCompositeOperation = "source-over";
  }

  const actx = maskA.getContext("2d")!;
  actx.globalCompositeOperation = "destination-in";
  actx.drawImage(maskB, 0, 0);
  actx.globalCompositeOperation = "source-over";

  return maskA;
}

export function applyFeatheredMask(
  ctx: CanvasRenderingContext2D,
  ogImg: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  feather: number,
  radius: number,
  irregularity: number,
  seed: number,
  irregRadius: number,
  irregDensity: number,
  irregBlur: number,
): void {
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d")!;

  tctx.drawImage(
    ogImg,
    0,
    0,
    ogImg.naturalWidth,
    ogImg.naturalHeight,
    0,
    0,
    w,
    h,
  );

  if (feather <= 0 && radius <= 0 && irregularity <= 0) {
    ctx.drawImage(temp, x, y);
    return;
  }

  const mask = generateCombinedMask(
    w,
    h,
    feather,
    radius,
    irregularity,
    irregRadius,
    irregDensity,
    seed,
    irregBlur,
  );

  tctx.globalCompositeOperation = "destination-in";
  tctx.drawImage(mask, 0, 0);
  tctx.globalCompositeOperation = "source-over";

  ctx.drawImage(temp, x, y);
}

export type GuideAnalysis = {
  canvasW: number;
  canvasH: number;
  ogX: number;
  ogY: number;
};

export function analyzeGuide(
  guideCanvas: HTMLCanvasElement,
  ogWidth: number,
  ogHeight: number,
): GuideAnalysis | null {
  const ctx = guideCanvas.getContext("2d")!;
  const data = ctx.getImageData(
    0,
    0,
    guideCanvas.width,
    guideCanvas.height,
  ).data;

  const threshold = 12;
  let minX = guideCanvas.width;
  let minY = guideCanvas.height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < guideCanvas.height; y++) {
    for (let x = 0; x < guideCanvas.width; x++) {
      const i = (y * guideCanvas.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (
        Math.abs(r - 128) > threshold ||
        Math.abs(g - 128) > threshold ||
        Math.abs(b - 128) > threshold
      ) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  const newCanvasW = Math.round(ogWidth * (guideCanvas.width / bboxW));
  const newCanvasH = Math.round(ogHeight * (guideCanvas.height / bboxH));

  const newX = Math.round((minX / guideCanvas.width) * newCanvasW);
  const newY = Math.round((minY / guideCanvas.height) * newCanvasH);

  return { canvasW: newCanvasW, canvasH: newCanvasH, ogX: newX, ogY: newY };
}

export function downloadCanvasAsBlob(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
