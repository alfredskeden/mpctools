import React from "react";

// Tracks visibility calls on the most recent Transformer instance
export const transformerVisibilityCalls: boolean[] = [];

function createMockNode(x: number, y: number, scaleX = 1, rotation = 0) {
  const state = { x, y, scaleX, rotation };
  return {
    x(val?: number) {
      if (val !== undefined) state.x = val;
      return state.x;
    },
    y(val?: number) {
      if (val !== undefined) state.y = val;
      return state.y;
    },
    scaleX(val?: number) {
      if (val !== undefined) state.scaleX = val;
      return state.scaleX;
    },
    rotation(val?: number) {
      if (val !== undefined) state.rotation = val;
      return state.rotation;
    },
  };
}

export const Stage = React.forwardRef(function MockStage(
  {
    children,
    onWheel,
    pixelRatio,
  }: {
    children?: React.ReactNode;
    width?: number;
    height?: number;
    pixelRatio?: number;
    onWheel?: (e: { evt: WheelEvent }) => void;
  },
  ref: React.Ref<{ toDataURL: (opts?: object) => string }>,
) {
  React.useImperativeHandle(ref, () => ({
    toDataURL: () => "data:image/png;base64,mock",
  }));

  return (
    <div
      data-testid="konva-stage"
      data-pixel-ratio={pixelRatio}
      onWheel={
        onWheel
          ? (e: React.WheelEvent) => {
              onWheel({ evt: e.nativeEvent });
            }
          : undefined
      }
    >
      {children}
    </div>
  );
});

export const Layer = React.forwardRef(function MockLayer(
  { children }: { children?: React.ReactNode },
  ref: React.Ref<{ visible: (v?: boolean) => boolean; toDataURL: (opts?: object) => string }>,
) {
  const visibleState = React.useRef(true);

  React.useImperativeHandle(ref, () => ({
    visible(v?: boolean) {
      if (v !== undefined) visibleState.current = v;
      return visibleState.current;
    },
    toDataURL: () => "data:image/png;base64,mock",
  }));

  return <>{children}</>;
});

export function Rect() {
  return <div data-testid="konva-rect" />;
}

export function Image({
  draggable,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  x,
  y,
  scaleX,
  rotation,
  listening,
}: {
  image?: HTMLImageElement | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  draggable?: boolean;
  onDragMove?: (e: { target: ReturnType<typeof createMockNode> }) => void;
  onDragEnd?: (e: { target: ReturnType<typeof createMockNode> }) => void;
  onTransformEnd?: (e: { target: ReturnType<typeof createMockNode> }) => void;
  listening?: boolean;
  alt?: string;
}) {
  const isDragging = React.useRef(false);
  const hasMoved = React.useRef(false);
  const startPos = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      isDragging.current = true;
      hasMoved.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
    },
    [draggable],
  );

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !draggable) return;
      hasMoved.current = true;
      const newX = (x ?? 0) + (e.clientX - startPos.current.x);
      const newY = (y ?? 0) + (e.clientY - startPos.current.y);
      const mockNode = createMockNode(newX, newY, scaleX, rotation);
      onDragMove?.({ target: mockNode });
    },
    [draggable, onDragMove, x, y, scaleX, rotation],
  );

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging.current || !hasMoved.current) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    hasMoved.current = false;
    const mockNode = createMockNode(x ?? 0, y ?? 0, scaleX, rotation);
    onDragEnd?.({ target: mockNode });
  }, [onDragEnd, x, y, scaleX, rotation]);

  const handleDoubleClick = React.useCallback(() => {
    const mockNode = createMockNode(x ?? 0, y ?? 0, scaleX ?? 1, rotation ?? 0);
    onTransformEnd?.({ target: mockNode });
  }, [onTransformEnd, x, y, scaleX, rotation]);

  if (listening === false) {
    return <div data-testid="konva-overlay" />;
  }

  return (
    <div
      data-testid="konva-image"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    />
  );
}

export const Transformer = React.forwardRef(function MockTransformer(
  {
    onTransformEnd,
  }: {
    anchorSize?: number;
    anchorStrokeWidth?: number;
    anchorCornerRadius?: number;
    borderStrokeWidth?: number;
    rotateAnchorOffset?: number;
    anchorFill?: string;
    anchorStroke?: string;
    borderStroke?: string;
    padding?: number;
    onTransformEnd?: () => void;
  },
  ref: React.Ref<{
    nodes: (n: unknown[]) => void;
    getLayer: () => { batchDraw: () => void } | null;
    visible: (v?: boolean) => boolean;
  }>,
) {
  const visibleState = React.useRef(true);

  React.useImperativeHandle(ref, () => ({
    nodes: () => {},
    getLayer: () => ({ batchDraw: () => {} }),
    visible(v?: boolean) {
      if (v !== undefined) {
        transformerVisibilityCalls.push(v);
        visibleState.current = v;
      }
      return visibleState.current;
    },
  }));

  return <div data-testid="konva-transformer" onClick={onTransformEnd} />;
});
