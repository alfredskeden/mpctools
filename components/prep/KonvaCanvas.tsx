// KonvaCanvas.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Image, Transformer, Rect } from "react-konva";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";
import { OVERLAY_OPTIONS } from "@/hooks/use-prep-workflow";

const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT; // 11:15

// How big anchors should appear on screen (in CSS pixels)
const ANCHOR_SCREEN_SIZE = 12;
const ANCHOR_STROKE_SCREEN_WIDTH = 2;
const BORDER_STROKE_SCREEN_WIDTH = 2;

type KonvaCanvasProps = {
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

export const KonvaCanvas = ({
  image,
  selectedOverlay,
  scale: imageScale,
  position,
  rotation,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onExport,
}: KonvaCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayLayerRef = useRef<any>(null);
  const [loadedOverlayImage, setLoadedOverlayImage] = useState<HTMLImageElement | null>(null);

  const overlayOption = useMemo(
    () => OVERLAY_OPTIONS.find((o) => o.id === selectedOverlay) ?? null,
    [selectedOverlay],
  );

  // Load overlay image
  useEffect(() => {
    if (!overlayOption) return;

    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setLoadedOverlayImage(img);
    };
    img.src = `/overlays/${overlayOption.filename}`;

    return () => {
      cancelled = true;
    };
  }, [overlayOption]);

  // Derive the actual overlay image: only show if the option still matches
  const overlayImage = overlayOption ? loadedOverlayImage : null;

  // Attach transformer to image
  useEffect(() => {
    /* v8 ignore start */
    if (trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
    /* v8 ignore stop */
  }, [image]);

  // Eager export: generate dataUrl whenever image/position/scale/rotation changes
  useEffect(() => {
    if (!image || !stageRef.current) return;

    const overlayLayer = overlayLayerRef.current;
    const transformer = trRef.current;

    if (overlayLayer) overlayLayer.visible(false);
    if (transformer) transformer.visible(false);

    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 });

    if (transformer) transformer.visible(true);
    if (overlayLayer) overlayLayer.visible(true);

    onExport(dataUrl);
  }, [image, position, imageScale, rotation, onExport]);

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

      setDisplayScale(newScale);
      setDisplaySize({ width: displayWidth, height: displayHeight });
    };

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(container);

    updateScale();

    return () => observer.disconnect();
  }, []);

  const handleDragEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const node = e.target;
      onPositionChange(node.x(), node.y());
    },
    [onPositionChange],
  );

  const handleTransformEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const node = e.target;
      onScaleChange(node.scaleX());
      onRotationChange(node.rotation());
    },
    [onScaleChange, onRotationChange],
  );

  const inverseScale = 1 / displayScale;
  const anchorSize = ANCHOR_SCREEN_SIZE * inverseScale;
  const anchorStroke = ANCHOR_STROKE_SCREEN_WIDTH * inverseScale;
  const borderStroke = BORDER_STROKE_SCREEN_WIDTH * inverseScale;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: displaySize.width,
          height: displaySize.height,
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
            transform: `scale(${displayScale})`,
            transformOrigin: "top left",
          }}
        >
          <Stage ref={stageRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            <Layer>
              <Rect
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="#808080"
              />
            </Layer>
            {image && (
              <Layer>
                <Image
                  ref={imgRef}
                  image={image}
                  x={position.x}
                  y={position.y}
                  scaleX={imageScale}
                  scaleY={imageScale}
                  rotation={rotation}
                  draggable
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                  alt=""
                />
                <Transformer
                  ref={trRef}
                  anchorSize={anchorSize}
                  anchorStrokeWidth={anchorStroke}
                  anchorCornerRadius={anchorSize / 2}
                  borderStrokeWidth={borderStroke}
                  rotateAnchorOffset={40 * inverseScale}
                  anchorFill="#ffffff"
                  anchorStroke="#0088ff"
                  borderStroke="#0088ff"
                  padding={8 * inverseScale}
                />
              </Layer>
            )}
            <Layer ref={overlayLayerRef}>
              {overlayImage && (
                <Image
                  image={overlayImage}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  listening={false}
                  alt=""
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};
