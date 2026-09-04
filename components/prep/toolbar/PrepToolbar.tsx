"use client";

import { useState, useRef, useCallback } from "react";
import { Move, Layers, Square, Clock } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { ToolbarIconButton } from "./ToolbarIconButton";
import { ToolbarPanelWrapper } from "./ToolbarPanelWrapper";
import { ImageControlsPanel } from "./panels/ImageControlsPanel";
import { OverlayGuidesPanel } from "./panels/OverlayGuidesPanel";
import { CanvasSizePanel } from "./panels/CanvasSizePanel";
import { DpiOverridePanel } from "./panels/DpiOverridePanel";
import type {
  PrepState,
  Algorithm,
  VerticalPreset,
  CanvasSizingMode,
} from "@/hooks/use-prep-workflow";

export type ToolbarPanel = "image" | "overlays" | "canvas" | "dpi";

type PrepToolbarProps = {
  disabled: boolean;
  state: PrepState;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateScale: (scale: number) => void;
  onUpdateRotation: (rotation: number) => void;
  onToggleOverlay: (overlay: string) => void;
  onSetOverlayOpacity: (id: string, opacity: number) => void;
  onSetCanvasSize: (width: number, height: number) => void;
  onSetCanvasSizingMode: (mode: CanvasSizingMode) => void;
  onSetCanvasSizeStep: (step: number) => void;
  onSetNativeCanvasDimension: (
    axis: "width" | "height",
    value: number,
  ) => void;
  onSetDpiOverride: (dpi: number | null) => void;
  onSetKeepAspectRatio: (keep: boolean) => void;
  onSetAlgorithm: (algorithm: Algorithm) => void;
  onSetImageDimensions: (width: number, height: number) => void;
  onCenterHorizontal: () => void;
  onCenterVertical: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onSetVerticalPreset: (preset: VerticalPreset) => void;
};

const PANELS: {
  id: ToolbarPanel;
  icon: typeof Move;
  label: string;
  title: string;
}[] = [
  { id: "image", icon: Move, label: "Image Controls", title: "Image Controls" },
  {
    id: "overlays",
    icon: Layers,
    label: "Overlay Guides",
    title: "Overlay Guides",
  },
  { id: "canvas", icon: Square, label: "Canvas Size", title: "Canvas Size" },
  { id: "dpi", icon: Clock, label: "DPI Override", title: "DPI Override" },
];

export function PrepToolbar({
  disabled,
  state,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
  onToggleOverlay,
  onSetOverlayOpacity,
  onSetCanvasSize,
  onSetCanvasSizingMode,
  onSetCanvasSizeStep,
  onSetNativeCanvasDimension,
  onSetDpiOverride,
  onSetKeepAspectRatio,
  onSetAlgorithm,
  onSetImageDimensions,
  onCenterHorizontal,
  onCenterVertical,
  onFitWidth,
  onFitHeight,
  onSetVerticalPreset,
}: PrepToolbarProps) {
  const [activePanel, setActivePanel] = useState<ToolbarPanel | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  useClickOutside(toolbarRef, closePanel, activePanel !== null);

  const handleIconClick = useCallback((panelId: ToolbarPanel) => {
    setActivePanel((current) => (current === panelId ? null : panelId));
  }, []);

  const activePanelConfig = PANELS.find((p) => p.id === activePanel);

  return (
    <div
      ref={toolbarRef}
      className="relative z-10 hidden md:flex flex-col"
    >
      {/* Icon strip */}
      <div className="flex flex-1 w-11 flex-col items-center gap-1 border-r border-surface-border bg-surface-base pt-2">
        {PANELS.map((panel) => (
          <ToolbarIconButton
            key={panel.id}
            icon={panel.icon}
            label={panel.label}
            isActive={activePanel === panel.id}
            disabled={disabled}
            onClick={() => handleIconClick(panel.id)}
          />
        ))}
      </div>

      {/* Active panel */}
      {activePanel && activePanelConfig && (
        <div className="absolute left-full top-0 bottom-0 z-10 overflow-y-auto">
        <ToolbarPanelWrapper title={activePanelConfig.title}>
          {activePanel === "image" && (
            <ImageControlsPanel
              state={state}
              onUpdatePosition={onUpdatePosition}
              onUpdateScale={onUpdateScale}
              onUpdateRotation={onUpdateRotation}
              onSetKeepAspectRatio={onSetKeepAspectRatio}
              onSetAlgorithm={onSetAlgorithm}
              onSetImageDimensions={onSetImageDimensions}
              onCenterHorizontal={onCenterHorizontal}
              onCenterVertical={onCenterVertical}
              onFitWidth={onFitWidth}
              onFitHeight={onFitHeight}
              onSetVerticalPreset={onSetVerticalPreset}
            />
          )}
          {activePanel === "overlays" && (
            <OverlayGuidesPanel
              selectedOverlays={state.selectedOverlays}
              overlayOpacities={state.overlayOpacities}
              onToggleOverlay={onToggleOverlay}
              onSetOverlayOpacity={onSetOverlayOpacity}
            />
          )}
          {activePanel === "canvas" && (
            <CanvasSizePanel
              canvasWidth={state.canvasWidth}
              canvasHeight={state.canvasHeight}
              canvasSizingMode={state.canvasSizingMode}
              canvasAspect={state.canvasAspect}
              onSetCanvasSize={onSetCanvasSize}
              onSetCanvasSizingMode={onSetCanvasSizingMode}
              onSetCanvasSizeStep={onSetCanvasSizeStep}
              onSetNativeCanvasDimension={onSetNativeCanvasDimension}
            />
          )}
          {activePanel === "dpi" && (
            <DpiOverridePanel
              dpiOverride={state.dpiOverride}
              onSetDpiOverride={onSetDpiOverride}
              disabled={state.canvasSizingMode === "native-image"}
            />
          )}
        </ToolbarPanelWrapper>
        </div>
      )}
    </div>
  );
}
