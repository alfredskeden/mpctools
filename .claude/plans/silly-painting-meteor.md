# Plan: Prep Page (`/prep`) — Step 1: Prepare Image

## Context

The app is an MPC proxy card art tool with a 3-step flow: Prep → Outpaint → Merge. The home page and `StepIndicator` exist already. We need to build the first functional step page where users upload card art, position it on a canvas, and export a prepared PNG.

## Scope

Full UI + working upload + canvas positioning + PNG export. Interactive instruction steps that highlight as the user progresses.

## Component Hierarchy

```
app/prep/page.tsx (server component shell)
  └─ PrepPageContent ("use client", orchestrates state)
       ├─ PrepHeader (badge + title + StepIndicator)
       ├─ Main grid (responsive: side-by-side desktop, stacked mobile)
       │    ├─ ImageDropZone → PrepCanvas (swaps after upload)
       │    └─ InstructionSteps (3 numbered interactive steps)
       └─ PrepActions (Download PNG + Continue to Outpaint)
```

## File Structure

```
app/prep/
  page.tsx / page.test.tsx

components/prep/
  prep-page-content.tsx / .test.tsx    -- orchestrator with usePrepWorkflow
  prep-header.tsx / .test.tsx          -- top bar
  image-drop-zone.tsx / .test.tsx      -- drag-and-drop + click-to-browse
  prep-canvas.tsx / .test.tsx          -- canvas with drag-to-position + wheel-to-zoom
  instruction-steps.tsx / .test.tsx    -- 3 numbered steps sidebar
  prep-actions.tsx / .test.tsx         -- bottom buttons

hooks/
  use-prep-workflow.ts / .test.ts      -- useReducer state machine

lib/
  canvas-utils.ts / .test.ts          -- pure functions for canvas math
```

## State Machine (`usePrepWorkflow`)

**State:** `currentStep` (1|2|3), `uploadedImage`, `imageElement`, `position`, `scale`, `isPositioned`, `canvasDataUrl`

**Transitions:**
- Start → step 1 (upload zone visible)
- `UPLOAD_IMAGE` → step 2 (canvas replaces drop zone, positioning enabled)
- `MARK_POSITIONED` → step 3 (download enabled)
- `SET_CANVAS_DATA_URL` → stores exported PNG

**Derived:** `canDownload`, `canContinue`, `stepStatuses[]`

## Canvas Strategy

- **Pure functions** in `lib/canvas-utils.ts`: `calculateFitDimensions`, `calculateDrawParams`, `clampPosition` — fully testable without DOM
- **Thin `PrepCanvas` component**: renders `<canvas>`, handles mouse drag + wheel zoom, calls callbacks to lift state
- **Export**: `canvas.toDataURL('image/png')` triggered by Download button
- **Testing**: `vitest-canvas-mock` for canvas API calls; pure math tested separately

## Key Implementation Details

### StepIndicator modification
The existing `StepIndicator` has hardcoded `className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center"`. Add an optional `className` prop to override the `<nav>` classes so it can be reused in the prep header without absolute positioning. Update existing tests.

### Vitest setup file
Create `vitest.setup.ts` with `import 'vitest-canvas-mock'` and reference it in `vitest.config.ts` `setupFiles`.

### Existing components to reuse
- `StepIndicator` — top bar progress (with className override)
- `Badge` — "STEP 1" label
- `Button` — Download PNG, Continue to Outpaint
- `cn()` — class merging
- Lucide icons: `Upload`, `Check`, `Download`, `ArrowRight`

## Build Order (TDD)

### Phase 1: Foundation
1. `vitest.setup.ts` + update `vitest.config.ts` (add setupFiles)
2. `StepIndicator` — add optional `className` prop + update tests
3. `lib/canvas-utils.ts` + tests (pure math functions)
4. `hooks/use-prep-workflow.ts` + tests (reducer + derived state)

### Phase 2: Leaf components
5. `components/prep/prep-header.tsx` + tests
6. `components/prep/instruction-steps.tsx` + tests
7. `components/prep/prep-actions.tsx` + tests
8. `components/prep/image-drop-zone.tsx` + tests

### Phase 3: Canvas
9. `components/prep/prep-canvas.tsx` + tests

### Phase 4: Composition
10. `components/prep/prep-page-content.tsx` + tests
11. `app/prep/page.tsx` + tests

## Verification

- `pnpm test` — all tests pass with 100% coverage
- Manual: navigate to `/prep`, upload an image, drag to position, zoom with wheel, download PNG
- Check responsive layout at desktop and mobile widths
