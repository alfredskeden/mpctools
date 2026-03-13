import React from "react";

function createMockNode(x: number, y: number) {
  const state = { x, y };
  return {
    x(val?: number) {
      if (val !== undefined) state.x = val;
      return state.x;
    },
    y(val?: number) {
      if (val !== undefined) state.y = val;
      return state.y;
    },
  };
}

export const Stage = React.forwardRef(function MockStage(
  {
    children,
    onWheel,
  }: {
    children?: React.ReactNode;
    width?: number;
    height?: number;
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
  ref: React.Ref<{ toDataURL: (opts?: object) => string }>,
) {
  React.useImperativeHandle(ref, () => ({
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
  x,
  y,
  listening,
}: {
  image?: HTMLImageElement | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  draggable?: boolean;
  onDragMove?: (e: { target: ReturnType<typeof createMockNode> }) => void;
  onDragEnd?: (e: object) => void;
  listening?: boolean;
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
      const mockNode = createMockNode(newX, newY);
      onDragMove?.({ target: mockNode });
    },
    [draggable, onDragMove, x, y],
  );

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging.current || !hasMoved.current) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    hasMoved.current = false;
    onDragEnd?.({});
  }, [onDragEnd]);

  if (listening === false) {
    return <div data-testid="konva-overlay" />;
  }

  return (
    <div
      data-testid="konva-image"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
