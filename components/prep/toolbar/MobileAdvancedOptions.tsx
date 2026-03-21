"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageControlsPanel } from "./panels/ImageControlsPanel";
import { OverlayGuidesPanel } from "./panels/OverlayGuidesPanel";
import { CanvasSizePanel } from "./panels/CanvasSizePanel";
import { DpiOverridePanel } from "./panels/DpiOverridePanel";
import type {
  PrepState,
  Algorithm,
  VerticalPreset,
} from "@/hooks/use-prep-workflow";

type MobileAdvancedOptionsProps = {
  state: PrepState;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateScale: (scale: number) => void;
  onUpdateRotation: (rotation: number) => void;
  onToggleOverlay: (overlay: string) => void;
  onSetOverlayOpacity: (id: string, opacity: number) => void;
  onSetCanvasSize: (width: number, height: number) => void;
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

const SECTIONS = [
  { id: "image", title: "Image Controls" },
  { id: "overlays", title: "Overlay Guides" },
  { id: "canvas", title: "Canvas Size" },
  { id: "dpi", title: "DPI Override" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function MobileAdvancedOptions({
  state,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
  onToggleOverlay,
  onSetOverlayOpacity,
  onSetCanvasSize,
  onSetDpiOverride,
  onSetKeepAspectRatio,
  onSetAlgorithm,
  onSetImageDimensions,
  onCenterHorizontal,
  onCenterVertical,
  onFitWidth,
  onFitHeight,
  onSetVerticalPreset,
}: MobileAdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(
    null,
  );

  const toggleSection = (id: SectionId) => {
    setExpandedSection((current) => (current === id ? null : id));
  };

  return (
    <div className="mt-3 md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-surface-border px-3 py-2 text-xs font-medium text-text-secondary"
        aria-expanded={isOpen}
      >
        Advanced options
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className="mt-2 flex flex-col gap-1"
          data-testid="mobile-advanced-sections"
        >
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium",
                  expandedSection === section.id
                    ? "bg-surface-overlay text-text-primary"
                    : "text-text-secondary",
                )}
                aria-expanded={expandedSection === section.id}
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform",
                    expandedSection === section.id && "rotate-180",
                  )}
                />
              </button>

              {expandedSection === section.id && (
                <div className="px-3 py-2">
                  {section.id === "image" && (
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
                  {section.id === "overlays" && (
                    <OverlayGuidesPanel
                      selectedOverlays={state.selectedOverlays}
                      overlayOpacities={state.overlayOpacities}
                      onToggleOverlay={onToggleOverlay}
                      onSetOverlayOpacity={onSetOverlayOpacity}
                    />
                  )}
                  {section.id === "canvas" && (
                    <CanvasSizePanel
                      canvasWidth={state.canvasWidth}
                      canvasHeight={state.canvasHeight}
                      onSetCanvasSize={onSetCanvasSize}
                    />
                  )}
                  {section.id === "dpi" && (
                    <DpiOverridePanel
                      dpiOverride={state.dpiOverride}
                      onSetDpiOverride={onSetDpiOverride}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
