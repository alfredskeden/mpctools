"use client";

import { useCallback, useEffect, useRef } from "react";
import { Minus, Plus, RotateCw } from "lucide-react";
import { useRepeatOnHold } from "@/hooks/use-repeat-on-hold";
import type { PrepState, Algorithm, VerticalPreset } from "@/hooks/use-prep-workflow";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.01;

const VERTICAL_PRESETS: VerticalPreset[] = ["short", "medium", "normal", "tall"];

type ImageControlsPanelProps = {
  state: PrepState;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateScale: (scale: number) => void;
  onUpdateRotation: (rotation: number) => void;
  onSetKeepAspectRatio: (keep: boolean) => void;
  onSetAlgorithm: (algorithm: Algorithm) => void;
  onSetImageDimensions: (width: number, height: number) => void;
  onCenterHorizontal: () => void;
  onCenterVertical: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onSetVerticalPreset: (preset: VerticalPreset) => void;
};

export function ImageControlsPanel({
  state,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
  onSetKeepAspectRatio,
  onSetAlgorithm,
  onSetImageDimensions,
  onCenterHorizontal,
  onCenterVertical,
  onFitWidth,
  onFitHeight,
  onSetVerticalPreset,
}: ImageControlsPanelProps) {
  const { position, scale, rotation, imageElement, keepAspectRatio, algorithm } =
    state;

  const imageWidth = imageElement
    ? Math.round(imageElement.width * scale)
    : 0;
  const imageHeight = imageElement
    ? Math.round(imageElement.height * scale)
    : 0;

  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const handleScaleDown = useCallback(() => {
    const current = scaleRef.current;
    const newScale = Math.max(MIN_SCALE, current - SCALE_STEP);
    onUpdateScale(Math.round(newScale * 100) / 100);
  }, [onUpdateScale]);

  const handleScaleUp = useCallback(() => {
    const current = scaleRef.current;
    const newScale = Math.min(MAX_SCALE, current + SCALE_STEP);
    onUpdateScale(Math.round(newScale * 100) / 100);
  }, [onUpdateScale]);

  const scaleDownHold = useRepeatOnHold(handleScaleDown);
  const scaleUpHold = useRepeatOnHold(handleScaleUp);

  const handleWidthChange = useCallback(
    (width: number) => {
      if (!imageElement || width <= 0) return;
      if (keepAspectRatio) {
        onSetImageDimensions(
          width,
          Math.round(width * (imageElement.height / imageElement.width)),
        );
      } else {
        onSetImageDimensions(width, imageHeight);
      }
    },
    [imageElement, keepAspectRatio, imageHeight, onSetImageDimensions],
  );

  const handleHeightChange = useCallback(
    (height: number) => {
      if (!imageElement || height <= 0) return;
      if (keepAspectRatio) {
        onSetImageDimensions(
          Math.round(height * (imageElement.width / imageElement.height)),
          height,
        );
      } else {
        onSetImageDimensions(imageWidth, height);
      }
    },
    [imageElement, keepAspectRatio, imageWidth, onSetImageDimensions],
  );

  const rotationDisplay = Math.round(rotation);

  return (
    <div className="flex flex-col gap-4">
      {/* Position & Size */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Position & Size
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-3">X</span>
            <input
              type="number"
              value={Math.round(position.x)}
              onChange={(e) =>
                onUpdatePosition(Number(e.target.value), position.y)
              }
              className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
              aria-label="Position X"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-3">Y</span>
            <input
              type="number"
              value={Math.round(position.y)}
              onChange={(e) =>
                onUpdatePosition(position.x, Number(e.target.value))
              }
              className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
              aria-label="Position Y"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-3">W</span>
            <input
              type="number"
              value={imageWidth}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
              aria-label="Width"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-3">H</span>
            <input
              type="number"
              value={imageHeight}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 font-mono text-xs text-text-primary"
              aria-label="Height"
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={keepAspectRatio}
            onChange={(e) => onSetKeepAspectRatio(e.target.checked)}
            className="accent-accent-blue"
          />
          Keep aspect ratio
        </label>
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Alignment */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Alignment
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCenterHorizontal}
            className="rounded border border-surface-border bg-surface-ground px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay"
          >
            Center H
          </button>
          <button
            type="button"
            onClick={onCenterVertical}
            className="rounded border border-surface-border bg-surface-ground px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay"
          >
            Center V
          </button>
        </div>
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Scale & Fit */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Scale & Fit
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onFitWidth}
            className="rounded bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/30"
          >
            Fit W
          </button>
          <button
            type="button"
            onClick={onFitHeight}
            className="rounded bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/30"
          >
            Fit H
          </button>
          <button
            type="button"
            disabled={scale <= MIN_SCALE}
            className="rounded border border-surface-border bg-surface-ground px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay disabled:text-text-disabled"
            aria-label="Scale down"
            {...scaleDownHold}
          >
            <Minus className="mx-auto size-3.5" />
          </button>
          <button
            type="button"
            disabled={scale >= MAX_SCALE}
            className="rounded border border-surface-border bg-surface-ground px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay disabled:text-text-disabled"
            aria-label="Scale up"
            {...scaleUpHold}
          >
            <Plus className="mx-auto size-3.5" />
          </button>
        </div>
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Rotation */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Rotation
        </legend>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <RotateCw className="size-3.5 text-text-secondary" />
            <span className="text-xs text-text-secondary">Angle</span>
          </div>
          <span className="text-xs font-medium text-accent-blue">
            {rotationDisplay}&deg;
          </span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={rotationDisplay}
          onChange={(e) => onUpdateRotation(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-subtle accent-accent-blue [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
          aria-label="Rotation"
        />
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Vertical Presets */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Vertical Presets
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {VERTICAL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onSetVerticalPreset(preset)}
              className="rounded-full border border-accent-blue/40 px-3 py-1 text-xs font-medium text-accent-blue hover:bg-accent-blue/10"
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="h-px bg-surface-border" />

      {/* Algorithm */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-label text-text-tertiary">
          Algorithm
        </legend>
        <select
          value={algorithm}
          onChange={(e) => onSetAlgorithm(e.target.value as Algorithm)}
          className="w-full rounded border border-surface-border bg-surface-ground px-2 py-1.5 text-xs text-text-primary"
          aria-label="Algorithm"
        >
          <option value="detail-preserving">Detail-preserving</option>
          <option value="standard">Standard high-quality</option>
        </select>
      </fieldset>
    </div>
  );
}
