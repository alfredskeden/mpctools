# Native-image canvas sizing mode (Prep step)

## Outcome

The Prep step gains a second, opt-in way to size the grey canvas. In the new mode the
uploaded image is never scaled — it sits at its native pixel size — and a slider moves the
grey canvas through every 11:15 integer size in a sensible range. The existing behaviour
(image auto-fitted to a fixed canvas, canvas picked from presets or W/H inputs) stays the
default and is untouched.

## Why

Today Prep inverts what the user wants. On upload the image is scaled to 80% of the canvas
(`calculateInitialScale`), and every sizing control works by changing the *image's* scale
relative to a chosen canvas. When the source art is already at the right pixel resolution,
any scaling is destructive resampling. The user wants to keep the pixels exactly as
uploaded and instead grow or shrink the grey border around them.

## The two modes

| | `scale-image` (default, existing) | `native-image` (new) |
| --- | --- | --- |
| Image scale | user-controlled, auto-fit on upload | locked to `1` |
| Canvas size | presets + W/H number inputs, any aspect | slider over 11:15 sizes only |
| Overflow | image kept inside canvas | image may spill past the canvas and be cropped on export |

## Decisions

**Mode is a single state field, not two code paths.** Add `canvasSizingMode:
"scale-image" | "native-image"` to `PrepState` in `hooks/use-prep-workflow.ts`, defaulting
to `"scale-image"`. Render, preview and export already take `canvasWidth`/`canvasHeight` as
parameters, so they need no changes at all.

**The slider's domain is a step count, not pixels.** All legal sizes are `11k × 15k`.
Slider range `k = 100 … 700`, step `1`, giving `1100×1500` up to `7700×10500` — 601 stops.
The current default canvas `3520×4800` is exactly `k = 320`, so entering the mode from a
fresh state changes nothing visible. Keep `k` derived, not stored: the state of record stays
`canvasWidth`/`canvasHeight`, and the slider reads its value back from the width.

**Entering the mode locks scale to 1 but keeps position.** `scale` becomes `1`; `position.x`
/ `position.y` are left as they are. No clamping, no recentering — the image may already be
partly outside, and that is allowed (see overflow below).

**Entering the mode snaps the canvas to the nearest legal 11:15 size.** The user may arrive
from a non-11:15 preset (e.g. `Classic borderless` 3712×4608). Snap via
`nearestCanvasStep(width)` = `round(width / 11)` clamped to `[100, 700]`, then set the canvas
to `11k × 15k`. Height is ignored in the snap — width is the anchor.

**Resizing preserves the image's offset from the canvas centre.** When the slider moves the
canvas from `W₀×H₀` to `W₁×H₁`, the image's centre point keeps the same offset from the
canvas centre, so the grey border grows evenly on all sides. Concretely, with `cx = position.x
+ imgW/2` (and likewise for y), the new position is `position.x + (W₁ - W₀) / 2`. Manual
dragging still works and its offset survives further slider moves.

**Overflow is allowed and crops on export.** The canvas is a viewport. When the chosen 11:15
size is smaller than the image, the image spills past the edges and the exported PNG contains
only what fell inside. No warning, no clamped slider minimum.

**Scale-changing controls are disabled, not hidden, while the mode is active.** Greyed out
with a short hint that the mode locks image scale:

- `ImageControlsPanel`: the zoom/scale slider, the image dimension W/H inputs, `Fit width`,
  `Fit height`
- `DpiOverridePanel`: the whole panel (its only job is deriving a scale from DPI)

Left enabled: rotation, position nudges, centre horizontal/vertical, vertical presets,
keep-aspect-ratio, algorithm, overlays.

**Overlay guides are left exactly as they are.** They stretch to 100% of canvas width in both
preview and export. In `native-image` mode they will no longer line up with the un-scaled
image; that is accepted and out of scope. Do not add overlay-to-image scaling.

**Upload while the mode is already active must not auto-fit.** The `UPLOAD_IMAGE` reducer
branch currently always calls `calculateInitialScale`. Add a branch: in `native-image` mode
set `scale: 1` and centre the image in the current canvas (`(canvasWidth - el.width) / 2`).

**The mode itself is not persisted.** The existing `sessionStorage` sync of
`PREP_CANVAS_SIZE_KEY` already carries the resulting width/height to the Outpaint step, which
is all Outpaint needs. Do not add a second key.

## Where the work lands

Pure math helpers → `lib/canvas-utils.ts` (tests inline in `lib/canvas-utils.test.ts`):

- `CANVAS_ASPECT_W = 11`, `CANVAS_ASPECT_H = 15`
- `MIN_CANVAS_STEP = 100`, `MAX_CANVAS_STEP = 700`
- `canvasSizeForStep(k): Dimensions`
- `nearestCanvasStep(width): number` (rounds and clamps)

State → `hooks/use-prep-workflow.ts`: the new field, a `SET_CANVAS_SIZING_MODE` action, a
`SET_CANVAS_SIZE_STEP` action, the `UPLOAD_IMAGE` branch, and hook callbacks
(`setCanvasSizingMode`, `setCanvasSizeStep`) each firing an analytics `track` call in line
with the neighbouring callbacks.

UI → `components/prep/toolbar/panels/CanvasSizePanel.tsx`: mode toggle at the top; when
`native-image` is active, replace the Dimensions inputs and Presets with the step slider plus
a read-out of the resulting `W × H`. `DpiOverridePanel` gains a `disabled` prop.
`ImageControlsPanel` already receives the whole `state`, so it reads the mode itself and needs
no new prop. `PrepToolbar` and `MobileAdvancedOptions` plumb the new callbacks and the
`disabled` flag for DPI.

Not touched: `lib/prep-renderer.ts`, `components/prep/TransformCanvas.tsx`,
`components/prep/prep-page-content.tsx` beyond passing the two new callbacks through, the
Outpaint and Merger steps, the watermark pipeline.

## Assumptions

- 11:15 is the only aspect ratio the new mode needs. Other ratios stay reachable through the
  existing mode.
- `k = 100 … 700` is "within reason". Widen the constants if that proves wrong; nothing else
  depends on the bounds.
- The preview canvas keeps fitting the grey canvas to the viewport (`TransformCanvas` computes
  a display scale from the aspect ratio), so a 7700-wide canvas still renders in the panel.
  The image only looks smaller on screen; its pixels are untouched.

## Suggested order of work

Each step is a full RED → GREEN → REFACTOR cycle, tests first, per the project's TDD rules.

1. **Canvas step math** — the four constants and two pure functions in `lib/canvas-utils.ts`.
2. **Mode state** — `canvasSizingMode` field, `SET_CANVAS_SIZING_MODE` (snaps canvas, forces
   `scale: 1`, keeps position), and switching back out (mode flips; canvas and scale stay).
3. **Step action** — `SET_CANVAS_SIZE_STEP` with the centre-preserving position shift.
4. **Upload branch** — `UPLOAD_IMAGE` at `scale: 1`, centred, when the mode is active.
5. **Hook surface** — the two callbacks and their `track` calls.
6. **Canvas Size panel** — mode toggle, slider, size read-out, swap-out of inputs/presets.
7. **Disabled controls** — `ImageControlsPanel` scale controls, `DpiOverridePanel` `disabled`
   prop, plumbing through `PrepToolbar` and `MobileAdvancedOptions`.

## Conventions that apply

The project's own rules in `CLAUDE.md` govern: `pnpm` only, tests alongside source
(`__tests__/` for components and hooks, inline for `lib/`), 100% coverage enforced,
behaviour-first assertions (no asserting on copy or CSS class names — use `data-active`,
`aria-*`, `disabled`, element presence, callbacks), no arbitrary Tailwind values, `@/` imports.
Never run `pnpm dev` or `pnpm build`; `pnpm test` and `pnpm lint:ts` only.
