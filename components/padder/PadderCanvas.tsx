"use client";

import { useEffect, useRef } from "react";
import { renderPadScene } from "@/lib/padder-renderer";
import type { PadLayout } from "@/lib/padder-math";

type PadderCanvasProps = {
  image: HTMLImageElement | null;
  layout: PadLayout | null;
};

/**
 * Preview only. The bitmap is the layout's true size and CSS scales it down to
 * the container — the download never comes from this element.
 */
export function PadderCanvas({ image, layout }: PadderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !layout) return;

    canvas.width = layout.canvas.width;
    canvas.height = layout.canvas.height;

    const ctx = canvas.getContext("2d");
    /* v8 ignore start */
    if (!ctx) return;
    /* v8 ignore stop */

    renderPadScene(ctx, image, layout);
  }, [image, layout]);

  if (!image || !layout) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="padder-canvas"
      className="max-h-full max-w-full rounded-lg object-contain"
    />
  );
}
