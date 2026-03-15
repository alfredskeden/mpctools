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
  selectedOverlay: string | null;
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
  selectedOverlay,
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

  // Drag state refs
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const overlayOption = useMemo(
    () => OVERLAY_OPTIONS.find((o) => o.id === selectedOverlay) ?? null,
    [selectedOverlay],
  );

  // Synchronously read from cache
  const cachedImage = overlayOption
    ? (overlayImageCache.get(overlayOption.filename) ?? null)
    : null;

  // Load overlay image asynchronously when not cached
  useEffect(() => {
    if (!overlayOption) return;

    const cacheKey = overlayOption.filename;
    if (overlayImageCache.has(cacheKey)) return;

    let cancelled = false;
    const img = new window.Image();
    /* v8 ignore start */
    img.onload = () => {
      if (!cancelled) {
        overlayImageCache.set(cacheKey, img);
        setAsyncLoadedImage(img);
      }
    };
    /* v8 ignore stop */
    img.src = `/overlays/${overlayOption.filename}`;

    return () => {
      cancelled = true;
    };
  }, [overlayOption]);

  const loadedOverlayImage = cachedImage ?? asyncLoadedImage;
  const overlayImage = overlayOption ? loadedOverlayImage : null;

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

  // Pointer handlers for drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!image) return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [image],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || display.scale === 0) return;

      const dx = (e.clientX - lastPointer.current.x) / display.scale;
      const dy = (e.clientY - lastPointer.current.y) / display.scale;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      onPositionChange(position.x + dx, position.y + dy);
    },
    [display.scale, position, onPositionChange],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
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

            {/* Overlay image */}
            {overlayImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                data-testid="transform-canvas-overlay"
                src={overlayImage.src}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  pointerEvents: "none",
                }}
              />
            )}

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
