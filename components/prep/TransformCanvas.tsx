"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, BG_COLOR } from "@/lib/canvas-utils";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";
import { renderPrepScene } from "@/lib/prep-renderer";

const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const EXPORT_DEBOUNCE_MS = 150;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const PREVIEW_SCALE = 0.25;

// Module-level cache for overlay images
const overlayImageCache = new Map<string, HTMLImageElement>();

type DisplayState = {
  scale: number;
  width: number;
  height: number;
};

type TransformCanvasProps = {
  image: HTMLImageElement | null;
  selectedOverlays: string[];
  scale: number;
  position: { x: number; y: number };
  rotation: number;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onExport: (dataUrl: string) => void;
};

export const TransformCanvas = ({
  image,
  selectedOverlays,
  scale: imageScale,
  position,
  rotation,
  onPositionChange,
  onScaleChange,
  onRotationChange: _onRotationChange,
  onExport,
}: TransformCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState<DisplayState>({
    scale: 1,
    width: 0,
    height: 0,
  });
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [asyncLoadedImage, setAsyncLoadedImage] =
    useState<HTMLImageElement | null>(null);

  // Drag state refs — track active pointer to ignore multi-touch (pinch)
  const isDragging = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const overlayOptions = useMemo(
    () => OVERLAY_OPTIONS.filter((o) => selectedOverlays.includes(o.id)),
    [selectedOverlays],
  );

  // Load overlay images asynchronously when not cached
  useEffect(() => {
    let cancelled = false;

    for (const option of overlayOptions) {
      const cacheKey = option.filename;
      if (overlayImageCache.has(cacheKey)) continue;

      const img = new window.Image();
      /* v8 ignore start */
      img.onload = () => {
        if (!cancelled) {
          overlayImageCache.set(cacheKey, img);
          setAsyncLoadedImage(img);
        }
      };
      /* v8 ignore stop */
      img.src = `/overlays/${option.filename}`;
    }

    return () => {
      cancelled = true;
    };
  }, [overlayOptions]);

  // Force re-read from cache when asyncLoadedImage changes
  void asyncLoadedImage;

  const overlayImages = overlayOptions
    .map((option) => ({
      option,
      image: overlayImageCache.get(option.filename) ?? null,
    }))
    .filter(
      (entry): entry is { option: (typeof OVERLAY_OPTIONS)[number]; image: HTMLImageElement } =>
        entry.image !== null,
    );

  const stageReady = display.width > 0;

  // Debounced export via offscreen canvas
  useEffect(() => {
    if (!image || !stageReady) return;

    if (exportTimerRef.current) {
      clearTimeout(exportTimerRef.current);
    }

    exportTimerRef.current = setTimeout(() => {
      const previewW = Math.round(CANVAS_WIDTH * PREVIEW_SCALE);
      const previewH = Math.round(CANVAS_HEIGHT * PREVIEW_SCALE);
      const offscreen = document.createElement("canvas");
      offscreen.width = previewW;
      offscreen.height = previewH;
      const offCtx = offscreen.getContext("2d");
      /* v8 ignore start */
      if (!offCtx) return;
      /* v8 ignore stop */

      renderPrepScene(offCtx, {
        image,
        position: {
          x: position.x * PREVIEW_SCALE,
          y: position.y * PREVIEW_SCALE,
        },
        scale: imageScale * PREVIEW_SCALE,
        rotation,
        canvasWidth: previewW,
        canvasHeight: previewH,
      });

      onExport(offscreen.toDataURL());
    }, EXPORT_DEBOUNCE_MS);

    /* v8 ignore start */
    return () => {
      if (exportTimerRef.current) {
        clearTimeout(exportTimerRef.current);
      }
    };
    /* v8 ignore stop */
  }, [image, position, imageScale, rotation, onExport, stageReady]);

  // Observe container and compute display scale
  useEffect(() => {
    const container = containerRef.current;
    /* v8 ignore start */
    if (!container) return;
    /* v8 ignore stop */

    const updateScale = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect();

      if (cw === 0 || ch === 0) return;

      let displayWidth: number;
      let displayHeight: number;

      if (cw / ch > ASPECT_RATIO) {
        displayHeight = ch;
        displayWidth = ch * ASPECT_RATIO;
      } else {
        displayWidth = cw;
        displayHeight = cw / ASPECT_RATIO;
      }

      const newScale = displayWidth / CANVAS_WIDTH;

      setDisplay({
        scale: newScale,
        width: displayWidth,
        height: displayHeight,
      });
    };

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(container);

    updateScale();

    return () => observer.disconnect();
  }, []);

  // Pointer handlers for drag — only track one pointer to prevent pinch chaos
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!image) return;
      // Ignore additional fingers — only first touch can pan
      if (activePointerId.current !== null) return;
      activePointerId.current = e.pointerId;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [image],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to the pointer that started the drag
      if (!isDragging.current || display.scale === 0) return;
      if (e.pointerId !== activePointerId.current) return;

      const dx = (e.clientX - lastPointer.current.x) / display.scale;
      const dy = (e.clientY - lastPointer.current.y) / display.scale;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      onPositionChange(position.x + dx, position.y + dy);
    },
    [display.scale, position, onPositionChange],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    isDragging.current = false;
    activePointerId.current = null;
  }, []);

  // Wheel handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!image) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, imageScale + delta),
      );
      onScaleChange(newScale);
    },
    [image, imageScale, onScaleChange],
  );

  // Suppress unused rotation callback warning - rotation is controlled via ControlsPanel slider
  void _onRotationChange;

  return (
    <div
      ref={containerRef}
      data-testid="transform-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {stageReady && (
        <div
          style={{
            width: display.width,
            height: display.height,
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${display.scale})`,
              transformOrigin: "top left",
              position: "relative",
            }}
          >
            {/* Gray background */}
            <div
              data-testid="transform-canvas-bg"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: BG_COLOR,
              }}
            />

            {/* Image with CSS transforms */}
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                data-testid="transform-canvas-image"
                src={image.src}
                alt=""
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: image.width,
                  height: image.height,
                  transform: `translate(${position.x}px, ${position.y}px) scale(${imageScale}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  willChange: "transform",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Overlay images */}
            {overlayImages.map(({ option, image: overlayImg }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={option.id}
                data-testid="transform-canvas-overlay"
                src={overlayImg.src}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Interaction surface */}
            <div
              data-testid="transform-canvas-interaction"
              style={{
                position: "absolute",
                inset: 0,
                cursor: image ? "grab" : "default",
                touchAction: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            />
          </div>
        </div>
      )}
    </div>
  );
};
