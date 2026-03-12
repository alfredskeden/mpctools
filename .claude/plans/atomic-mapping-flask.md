# Plan: Update Prep Page Canvas to Match Gemini Image Prepper

## Context

The prep page currently constrains the uploaded image to always cover the entire 744x1039 canvas (no background visible). The gemini-image-prepper project (<https://github.com/alfredskeden/gemini-image-prepper>) uses a different model: a gray (#808080) canvas background where users freely position their image, then overlay card frame templates on top. The gray areas represent what Gemini will fill during outpainting. Overlay PNGs are already in `public/overlays/`.

## Changes (in TDD order)

### 1. Loose position clamping (`lib/canvas-utils.ts`)

**Current:** `clampPosition()` locks image to `{0,0}` when smaller than canvas; prevents any background from showing when larger.

**New:** Image must stay at least partially visible (e.g. 50px `MIN_VISIBLE` margin). Both axes use:
```
minOffset = MIN_VISIBLE - (canvasSize + scaledImageSize) / 2
maxOffset = (canvasSize + scaledImageSize) / 2 - MIN_VISIBLE
```
This works for images both smaller and larger than the canvas.

**Tests to update:** `lib/canvas-utils.test.ts` — the "smaller than canvas" test currently expects `{0,0}`, needs new expectations. Add boundary tests for the loose constraint.

### 2. State management — add `selectedOverlay` (`hooks/use-prep-workflow.ts`)

- Add `selectedOverlay: string | null` to `PrepState` (initial: `null`)
- Add `SELECT_OVERLAY` action
- `UPLOAD_IMAGE` resets overlay to `null`
- Add `selectOverlay` callback to hook return
- Export `OVERLAY_OPTIONS` constant mapping overlay ids to labels and filenames

### 3. Gray canvas background (`components/prep/prep-canvas.tsx`)

Replace `ctx.clearRect(...)` with:
```ts
ctx.fillStyle = "#808080";
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
```

### 4. Overlay selector UI (new: `components/prep/overlay-selector.tsx`)

- Renders buttons for each overlay option from `OVERLAY_OPTIONS`
- Props: `selectedOverlay`, `onSelectOverlay`
- Highlights selected button
- Includes "None" option to deselect

### 5. Overlay drawing on canvas (`components/prep/prep-canvas.tsx`)

- Add `selectedOverlay: string | null` prop
- Load overlay `HTMLImageElement` via `useEffect` + ref when selection changes
- After drawing user image, draw overlay at full canvas size if loaded
- Use ref (not state) to avoid re-render loops

### 6. Wire everything together (`components/prep/prep-page-content.tsx`)

- Pass `selectedOverlay` and `selectOverlay` from workflow hook
- Render `OverlaySelector` when image is uploaded (step 2+)
- Pass `selectedOverlay` to `PrepCanvas`

## Files to modify

| File | Change |
|------|--------|
| `lib/canvas-utils.ts` | Rewrite `clampPosition` for loose constraints |
| `lib/canvas-utils.test.ts` | Update clamping tests |
| `hooks/use-prep-workflow.ts` | Add `selectedOverlay` state + action |
| `hooks/use-prep-workflow.test.ts` | Add overlay state tests |
| `components/prep/prep-canvas.tsx` | Gray background + overlay drawing + new prop |
| `components/prep/prep-canvas.test.tsx` | Update background + overlay tests |
| `components/prep/prep-page-content.tsx` | Wire overlay selector |
| `components/prep/prep-page-content.test.tsx` | Test overlay integration |

## New files

| File | Purpose |
|------|---------|
| `components/prep/overlay-selector.tsx` | Overlay button group component |
| `components/prep/overlay-selector.test.tsx` | Tests for overlay selector |

## Verification

- `pnpm test` — all tests pass with 100% coverage
- Manual: upload image, verify gray background shows, drag/zoom image freely (loosely constrained), select overlay to see it rendered on top, download PNG with overlay applied
