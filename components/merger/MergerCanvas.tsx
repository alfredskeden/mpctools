"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { applyFeatheredMask } from "@/lib/merger-utils";
import type { MergerState } from "@/hooks/use-merger-workflow";

const MAX_DISPLAY_DIM = 2048;

export type MergerCanvasHandle = {
  getDownloadCanvas: () => HTMLCanvasElement | null;
};

type MergerCanvasProps = {
  state: MergerState;
};

export function drawMergerScene(
  ctx: CanvasRenderingContext2D,
  state: MergerState,
  scale: number,
) {
  ctx.save();
  ctx.scale(scale, scale);

  // Clear with gray background
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, state.canvasW, state.canvasH);

  // Draw outpaint as background if available
  if (state.outpaintImage) {
    ctx.drawImage(state.outpaintImage, 0, 0, state.canvasW, state.canvasH);
  }

  // Draw OG with feathered mask
  if (state.ogImage) {
    const { x, y, w, h } = state.ogPosition;
    applyFeatheredMask(
      ctx,
      state.ogImage,
      x,
      y,
      w,
      h,
      state.featherStrength,
      10,
      0,
      42,
      10,
      50,
      2,
    );
  }

  ctx.restore();
}

export const MergerCanvas = forwardRef<MergerCanvasHandle, MergerCanvasProps>(
  function MergerCanvas({ state }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

    const hasContent = state.canvasW > 0 && state.canvasH > 0;
    const aspectRatio = hasContent ? state.canvasW / state.canvasH : 11 / 15;

    const updateDisplaySize = useCallback(() => {
      const container = containerRef.current;
      /* v8 ignore start */
      if (!container) return;
      /* v8 ignore stop */

      const rect = container.getBoundingClientRect();
      const maxW = rect.width;
      const maxH = rect.height;

      let w = maxW;
      let h = w / aspectRatio;

      if (h > maxH) {
        h = maxH;
        w = h * aspectRatio;
      }

      setDisplaySize({ width: Math.round(w), height: Math.round(h) });
    }, [aspectRatio]);

    useEffect(() => {
      const observer = new ResizeObserver(updateDisplaySize);
      /* v8 ignore start */
      if (containerRef.current) observer.observe(containerRef.current);
      /* v8 ignore stop */
      return () => observer.disconnect();
    }, [updateDisplaySize]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !hasContent) return;

      const renderScale = Math.min(
        1,
        MAX_DISPLAY_DIM / Math.max(state.canvasW, state.canvasH),
      );
      canvas.width = Math.round(state.canvasW * renderScale);
      canvas.height = Math.round(state.canvasH * renderScale);
      const ctx = canvas.getContext("2d")!;

      drawMergerScene(ctx, state, renderScale);
    }, [
      state.canvasW,
      state.canvasH,
      state.ogImage,
      state.outpaintImage,
      state.ogPosition,
      state.featherStrength,
      hasContent,
      state,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        getDownloadCanvas() {
          if (!hasContent) return null;

          const canvas = document.createElement("canvas");
          canvas.width = state.canvasW;
          canvas.height = state.canvasH;
          const ctx = canvas.getContext("2d")!;

          drawMergerScene(ctx, state, 1);

          return canvas;
        },
      }),
      [hasContent, state],
    );

    return (
      <div
        ref={containerRef}
        className="flex size-full items-center justify-center"
        data-testid="merger-canvas-container"
      >
        {hasContent ? (
          <canvas
            ref={canvasRef}
            data-testid="merger-canvas"
            style={{
              width: displaySize.width,
              height: displaySize.height,
            }}
            className="rounded-lg"
          />
        ) : (
          <div
            className="flex aspect-canvas max-h-canvas max-w-canvas items-center justify-center rounded-lg bg-canvas-bg"
            data-testid="merger-canvas-placeholder"
          >
            <p className="text-sm text-text-secondary">
              Upload images to preview
            </p>
          </div>
        )}
      </div>
    );
  },
);
