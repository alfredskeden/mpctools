import {
  GEMINI_ALPHA_NOISE_FLOOR,
  GEMINI_ALPHA_THRESHOLD,
  GEMINI_MAX_ALPHA,
  GEMINI_LOGO_VALUE,
} from "@/lib/watermark-config";

// Isomorphic pixel-level math — no DOM or canvas dependencies.
// Operates on RawImageData: { data: Uint8ClampedArray, width: number, height: number }

export type RawImageData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type Region = {
  x: number;
  y: number;
  size: number;
};

// ─── Basic math ──────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export function meanAndVariance(values: Float32Array): {
  mean: number;
  variance: number;
} {
  if (!values.length) return { mean: 0, variance: 0 };
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) sum += values[i];
  const mean = sum / values.length;
  let sq = 0;
  for (let i = 0; i < values.length; i += 1) {
    const d = values[i] - mean;
    sq += d * d;
  }
  return { mean, variance: sq / values.length };
}

export function normalizedCrossCorrelation(
  a: Float32Array,
  b: Float32Array,
): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  const statsA = meanAndVariance(a);
  const statsB = meanAndVariance(b);
  const denominator =
    Math.sqrt(statsA.variance * statsB.variance) * a.length;
  if (!Number.isFinite(denominator) || denominator < 1e-8) return 0;
  let numerator = 0;
  for (let i = 0; i < a.length; i += 1) {
    numerator += (a[i] - statsA.mean) * (b[i] - statsB.mean);
  }
  return numerator / denominator;
}

// ─── Image → feature maps ─────────────────────────────────────────────────────

export function toGrayscale(img: RawImageData): Float32Array {
  const { width, height, data } = img;
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i += 1) {
    const j = i * 4;
    out[i] =
      (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255;
  }
  return out;
}

export function sobelMagnitude(
  gray: Float32Array,
  width: number,
  height: number,
): Float32Array {
  const grad = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] -
        2 * gray[i - 1] -
        gray[i + width - 1] +
        gray[i - width + 1] +
        2 * gray[i + 1] +
        gray[i + width + 1];
      const gy =
        -gray[i - width - 1] -
        2 * gray[i - width] -
        gray[i - width + 1] +
        gray[i + width - 1] +
        2 * gray[i + width] +
        gray[i + width + 1];
      grad[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return grad;
}

// ─── Region extraction ────────────────────────────────────────────────────────

export function getRegion(
  data: Float32Array,
  width: number,
  x: number,
  y: number,
  size: number,
): Float32Array {
  const out = new Float32Array(size * size);
  for (let row = 0; row < size; row += 1) {
    const srcBase = (y + row) * width + x;
    const dstBase = row * size;
    for (let col = 0; col < size; col += 1) {
      out[dstBase + col] = data[srcBase + col];
    }
  }
  return out;
}

export function stdDevRegion(
  data: Float32Array,
  width: number,
  x: number,
  y: number,
  size: number,
): number {
  let sum = 0;
  let sq = 0;
  let n = 0;
  for (let row = 0; row < size; row += 1) {
    const base = (y + row) * width + x;
    for (let col = 0; col < size; col += 1) {
      const v = data[base + col];
      sum += v;
      sq += v * v;
      n += 1;
    }
  }
  if (!n) return 0;
  const mean = sum / n;
  const variance = Math.max(0, sq / n - mean * mean);
  return Math.sqrt(variance);
}

// ─── Alpha map manipulation ───────────────────────────────────────────────────

export function interpolateAlphaMap(
  sourceAlpha: Float32Array,
  sourceSize: number,
  targetSize: number,
): Float32Array {
  if (targetSize <= 0) return new Float32Array(0);
  if (sourceSize === targetSize) return new Float32Array(sourceAlpha);
  const out = new Float32Array(targetSize * targetSize);
  const scale = (sourceSize - 1) / Math.max(1, targetSize - 1);
  for (let y = 0; y < targetSize; y += 1) {
    const sy = y * scale;
    const y0 = Math.floor(sy);
    const y1 = Math.min(sourceSize - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < targetSize; x += 1) {
      const sx = x * scale;
      const x0 = Math.floor(sx);
      const x1 = Math.min(sourceSize - 1, x0 + 1);
      const fx = sx - x0;
      const p00 = sourceAlpha[y0 * sourceSize + x0];
      const p10 = sourceAlpha[y0 * sourceSize + x1];
      const p01 = sourceAlpha[y1 * sourceSize + x0];
      const p11 = sourceAlpha[y1 * sourceSize + x1];
      const top = p00 + (p10 - p00) * fx;
      const bottom = p01 + (p11 - p01) * fx;
      out[y * targetSize + x] = top + (bottom - top) * fy;
    }
  }
  return out;
}

export function warpAlphaMap(
  alphaMap: Float32Array,
  size: number,
  opts: { dx?: number; dy?: number; scale?: number } = {},
): Float32Array {
  const { dx = 0, dy = 0, scale = 1 } = opts;
  if (size <= 0) return new Float32Array(0);
  if (dx === 0 && dy === 0 && scale === 1) return new Float32Array(alphaMap);

  const sample = (sx: number, sy: number): number => {
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const fx = sx - x0;
    const fy = sy - y0;
    const ix0 = clamp(x0, 0, size - 1);
    const iy0 = clamp(y0, 0, size - 1);
    const ix1 = clamp(x0 + 1, 0, size - 1);
    const iy1 = clamp(y0 + 1, 0, size - 1);
    const p00 = alphaMap[iy0 * size + ix0];
    const p10 = alphaMap[iy0 * size + ix1];
    const p01 = alphaMap[iy1 * size + ix0];
    const p11 = alphaMap[iy1 * size + ix1];
    const top = p00 + (p10 - p00) * fx;
    const bottom = p01 + (p11 - p01) * fx;
    return top + (bottom - top) * fy;
  };

  const out = new Float32Array(size * size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = (x - c) / scale + c + dx;
      const sy = (y - c) / scale + c + dy;
      out[y * size + x] = sample(sx, sy);
    }
  }
  return out;
}

// ─── Correlation helpers ──────────────────────────────────────────────────────

export function computeRegionSpatialCorrelation(
  img: RawImageData,
  alphaMap: Float32Array,
  region: Region,
): number {
  const { size } = region;
  if (!size || size <= 0) return 0;
  if (
    region.x < 0 ||
    region.y < 0 ||
    region.x + size > img.width ||
    region.y + size > img.height
  )
    return 0;
  const gray = toGrayscale(img);
  const patch = getRegion(gray, img.width, region.x, region.y, size);
  return normalizedCrossCorrelation(patch, alphaMap);
}

export function computeRegionGradientCorrelation(
  img: RawImageData,
  alphaMap: Float32Array,
  region: Region,
): number {
  const { size } = region;
  if (!size || size <= 2) return 0;
  if (
    region.x < 0 ||
    region.y < 0 ||
    region.x + size > img.width ||
    region.y + size > img.height
  )
    return 0;
  const gray = toGrayscale(img);
  const patch = getRegion(gray, img.width, region.x, region.y, size);
  const patchGrad = sobelMagnitude(patch, size, size);
  const alphaGrad = sobelMagnitude(alphaMap, size, size);
  return normalizedCrossCorrelation(patchGrad, alphaGrad);
}

// ─── Core watermark removal ───────────────────────────────────────────────────

export function removeWatermarkReverseAlpha(
  img: RawImageData,
  alphaMap: Float32Array,
  position: { x: number; y: number; width: number; height: number },
  options: { alphaGain?: number } = {},
): void {
  const { x, y, width, height } = position;
  const alphaGain =
    Number.isFinite(options.alphaGain) && options.alphaGain! > 0
      ? options.alphaGain!
      : 1;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const imgIdx = ((y + row) * img.width + (x + col)) * 4;
      const alphaIdx = row * width + col;
      const rawAlpha = alphaMap[alphaIdx];
      const signalAlpha =
        Math.max(0, rawAlpha - GEMINI_ALPHA_NOISE_FLOOR) * alphaGain;
      if (signalAlpha < GEMINI_ALPHA_THRESHOLD) continue;

      const alpha = Math.min(rawAlpha * alphaGain, GEMINI_MAX_ALPHA);
      const oneMinusAlpha = 1 - alpha;
      for (let c = 0; c < 3; c += 1) {
        const watermarked = img.data[imgIdx + c];
        const original =
          (watermarked - alpha * GEMINI_LOGO_VALUE) / oneMinusAlpha;
        img.data[imgIdx + c] = clamp(Math.round(original), 0, 255);
      }
    }
  }
}

export function cloneRawImageData(img: RawImageData): RawImageData {
  return {
    data: new Uint8ClampedArray(img.data),
    width: img.width,
    height: img.height,
  };
}

// ─── Pixel-level composite ────────────────────────────────────────────────────

export function compositeWithMask(
  base: RawImageData,
  overlay: RawImageData,
  maskData: Uint8ClampedArray,
): RawImageData {
  const { width, height } = base;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < base.data.length; i += 4) {
    const m = maskData[i + 3] / 255;
    if (m <= 0) {
      out[i] = base.data[i];
      out[i + 1] = base.data[i + 1];
      out[i + 2] = base.data[i + 2];
      out[i + 3] = base.data[i + 3];
    } else if (m >= 1) {
      out[i] = overlay.data[i];
      out[i + 1] = overlay.data[i + 1];
      out[i + 2] = overlay.data[i + 2];
      out[i + 3] = overlay.data[i + 3];
    } else {
      out[i] = Math.round(base.data[i] * (1 - m) + overlay.data[i] * m);
      out[i + 1] = Math.round(
        base.data[i + 1] * (1 - m) + overlay.data[i + 1] * m,
      );
      out[i + 2] = Math.round(
        base.data[i + 2] * (1 - m) + overlay.data[i + 2] * m,
      );
      out[i + 3] = Math.round(
        base.data[i + 3] * (1 - m) + overlay.data[i + 3] * m,
      );
    }
  }
  return { data: out, width, height };
}

export function applyMaskedLightness(
  img: RawImageData,
  maskData: Uint8ClampedArray,
  amount: number,
): void {
  const delta = (amount * 255) / 100;
  for (let i = 0; i < img.data.length; i += 4) {
    const maskAlpha = maskData[i + 3] / 255;
    if (maskAlpha <= 0) continue;
    img.data[i] = clamp(img.data[i] + delta * maskAlpha, 0, 255);
    img.data[i + 1] = clamp(img.data[i + 1] + delta * maskAlpha, 0, 255);
    img.data[i + 2] = clamp(img.data[i + 2] + delta * maskAlpha, 0, 255);
  }
}
