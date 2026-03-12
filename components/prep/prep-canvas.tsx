"use client";

import { useRef, useEffect, useCallback } from "react";
import { calculateDrawParams, clampPosition } from "@/lib/canvas-utils";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const CANVAS_WIDTH = 744;
const CANVAS_HEIGHT = 1039;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 0.001;

type PrepCanvasProps = {
  imageElement: HTMLImageElement;
  position: { x: number; y: number };
  scale: number;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onMarkPositioned: () => void;
  onCanvasDataUrl: (dataUrl: string) => void;
  selectedOverlay: string | null;
};

export function PrepCanvas({
  imageElement,
  position,
  scale,
  onPositionChange,
  onScaleChange,
  onMarkPositioned,
  onCanvasDataUrl,
  selectedOverlay,
}: PrepCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    /* v8 ignore start */
    if (!canvas) return;
    /* v8 ignore stop */

    const ctx = canvas.getContext("2d");
    /* v8 ignore start */
    if (!ctx) return;
    /* v8 ignore stop */

    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const params = calculateDrawParams(
      { width: imageElement.width, height: imageElement.height },
      { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      position,
      scale,
    );

    ctx.drawImage(
      imageElement,
      params.sx,
      params.sy,
      params.sw,
      params.sh,
      params.dx,
      params.dy,
      params.dw,
      params.dh,
    );

    if (overlayImageRef.current) {
      ctx.drawImage(overlayImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [imageElement, position, scale, selectedOverlay]);

  useEffect(() => {
    if (!selectedOverlay) {
      overlayImageRef.current = null;
      draw();
      return;
    }

    const option = OVERLAY_OPTIONS.find((o) => o.id === selectedOverlay);
    if (!option) {
      overlayImageRef.current = null;
      draw();
      return;
    }

    const img = new Image();
    img.src = `/overlays/${option.filename}`;
    img.onload = () => {
      overlayImageRef.current = img;
      draw();
    };
  }, [selectedOverlay, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const dataUrl = canvasRef.current?.toDataURL("image/png");
    /* v8 ignore start */
    if (!dataUrl) return;
    /* v8 ignore stop */
    onCanvasDataUrl(dataUrl);
  }, [position, scale, selectedOverlay, onCanvasDataUrl]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;

      hasDragged.current = true;

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const canvas = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
      const image = { width: imageElement.width, height: imageElement.height };
      const newPos = clampPosition(
        { x: position.x + dx, y: position.y + dy },
        image,
        canvas,
        scale,
      );

      onPositionChange(newPos.x, newPos.y);
    },
    [imageElement, position, scale, onPositionChange],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && hasDragged.current) {
      onMarkPositioned();
    }
    isDragging.current = false;
  }, [onMarkPositioned]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scale - e.deltaY * ZOOM_FACTOR),
      );
      onScaleChange(newScale);

      const canvas = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
      const image = { width: imageElement.width, height: imageElement.height };
      const clamped = clampPosition(position, image, canvas, newScale);
      onPositionChange(clamped.x, clamped.y);

      if (!hasDragged.current) {
        hasDragged.current = true;
        onMarkPositioned();
      }
    },
    [
      scale,
      imageElement,
      position,
      onScaleChange,
      onPositionChange,
      onMarkPositioned,
    ],
  );

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      role="img"
      aria-label="Card art canvas"
      className="max-h-[600px] w-full cursor-grab rounded-lg border object-contain active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
