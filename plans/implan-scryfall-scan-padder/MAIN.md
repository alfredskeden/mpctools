# Scryfall Scan Padder

## Outcome

A third entry point on the landing page, "Scryfall scan padder", leading to `/padder`: the
user uploads a Scryfall-downloaded card scan, picks one of two print targets, and downloads a
PNG in which the scan sits at its **exact original pixel size**, centered, on a `#808080` grey
canvas sized to the MPC print target. There are no transform controls — no drag, no zoom, no
canvas inputs. The correct padding is computed, not configured.

A companion static page `/padder-outpaint` tells the user which prompts to feed Gemini for a
padded scan, mirroring how `/outpaint` does it for the Prep flow.

## Why

`/prep` is built for source artwork of unknown size: it scales the image to fit a canvas the
user configures. A Scryfall scan is the opposite case — it is already at a known, correct
resolution, and any scaling is destructive resampling. What the user needs is purely additive:
keep every pixel, surround it with the exact amount of grey that turns the scan into an MPC
print-size canvas, hand it to Gemini to fill that grey. Doing this in `/prep` today means
fighting the scale controls to land on numbers the app could just compute.

## The pad math

**MPC print size.** MPC prints at 800 DPI, 2.48in x 3.46in, bleed included. The same physical
card at each common DPI:

| DPI | Pixels |
| --- | --- |
| 300 | 816 x 1110 |
| 600 | 1632 x 2220 |
| 800 | 2176 x 2960 |
| 1200 | 3264 x 4440 |

These four are the **tiers**. All share the ratio 816/1110 (0.7351), which is what the app
labels `11:15` for prompt purposes even though it is not exactly 11:15.

**Tier selection.** Pick the smallest tier whose width >= image width **and** height >= image
height. A 745x1040 Scryfall png and a 672x936 Scryfall "large" jpg both land on 816x1110. An
image larger than 3264x4440 fits no tier — that is an error state (see below), never a scale-down.

**Target: MPC default (11:15).** Canvas = the selected tier, unchanged. Image drawn at native
size, centered: `x = floor((tierW - imgW) / 2)`, `y = floor((tierH - imgH) / 2)`. For 745x1040
in 816x1110 that is `x = 35`, `y = 35` — a 35px grey margin all round.

**Target: Classic borderless (29:36).** Same tier, same image position, but the canvas is
**cropped from the bottom** to hit the ratio: `canvasW = tierW`, `canvasH = round(tierW * 36 / 29)`.

| Tier | 29:36 canvas |
| --- | --- |
| 816 x 1110 | 816 x 1013 |
| 1632 x 2220 | 1632 x 2026 |
| 2176 x 2960 | 2176 x 2701 |
| 3264 x 4440 | 3264 x 4052 |

The image keeps the `x`/`y` it had in the default layout. Nothing is re-centered vertically.

**Bottom crop cuts card art, on purpose.** For a 745x1040 scan the image spans y 35..1075 while
the canvas ends at 1013, so the bottom 62px of the card is cut off. This is the confirmed,
intended behaviour and matches the reference output. Report the number in the UI (see below) so
it is never a surprise, but do not clamp, warn-block, or shift the image up to avoid it.

## Decisions

**Standalone route, shared pure math.** `/padder` is its own route with its own thin hook and
canvas component. It does not reuse `usePrepWorkflow`, `TransformCanvas`, or the Prep toolbar —
those exist to expose transform controls this feature is defined by not having. It does reuse
`BG_COLOR` from `lib/canvas-utils.ts` and `downloadCanvasAsBlob` from `lib/merger-utils.ts`.

**No slider, no controls.** The only inputs are: the file, and a two-way target toggle. Layout
is derived from those two, every time. There is no stored position, scale, or canvas size.

**Layout is a pure function, not state.** The hook stores the image element, its file name, the
selected target, and a downloaded flag. `computePadLayout` derives everything else. This keeps
the whole feature testable without a DOM.

**Ratio labels are declared, not computed.** Each target carries `ratioLabel` (`"11:15"`,
`"29:36"`). Never gcd-reduce the pixel dimensions for display or for prompts — `816x1110`
reduces to `136:185`.

**Too-large images are refused, not resized.** If no tier fits, the page shows an error telling
the user to download a smaller Scryfall export, and offers no download. Never scale the image.

**Handoff to `/padder-outpaint` via its own sessionStorage key.** `/padder` writes
`{ width, height, ratioLabel }` under a new `PADDER_TARGET_KEY`. `/padder-outpaint` reads it to
fill the prompt's size and ratio, falling back to the 300 DPI default target when absent. Read it
in an effect or a lazy `useState` initialiser guarded by try/catch — never during SSR — following
how `components/outpaint/outpaint-page-content.tsx` already does it.

**`/padder-outpaint` prompt copy is a placeholder.** Two exported constants in
`lib/padder-prompts.ts` (a handshake builder and a command string), each carrying a `TODO`
comment saying the final wording is owed. Wire the copy buttons, the step cards, and the size/ratio
substitution for real; the prose is filler until replaced. Do not copy `/outpaint`'s prompts across
and present them as final.

**Chrome is shared between the two padder routes.** One `PadderShell` component with a small
header (link home, route title, a two-step "Pad -> Outpaint" indicator) used by both routes'
layouts, modelled on `app/design/layout.tsx`. The 3-step `Header` from the `(steps)` group does not
apply and `/padder` must stay outside that route group.

**Export is a full-resolution PNG.** Render the layout into an offscreen canvas at true canvas
pixel size and download via `downloadCanvasAsBlob` as `padded_<original-name>.png`. The on-screen
preview is a separately scaled render; it is never the download source.

## Where the work lands

New files, each with tests per the project's placement rules:

| File | Contents |
| --- | --- |
| `lib/padder-math.ts` (+ inline `.test.ts`) | `MPC_TIERS`, `PAD_TARGETS`, types, `selectTier`, `computePadLayout` |
| `lib/padder-renderer.ts` (+ inline `.test.ts`) | `renderPadScene(ctx, image, layout)`, `exportPaddedCanvas(image, layout)` |
| `lib/padder-prompts.ts` (+ inline `.test.ts`) | placeholder handshake builder + command, `PADDER_TARGET_KEY` |
| `hooks/use-padder-workflow.ts` (+ `hooks/__tests__/`) | reducer, upload, target select, downloaded flag, derived layout, error state |
| `components/padder/padder-page-content.tsx` | orchestrator: drop zone, target toggle, preview, actions |
| `components/padder/PadderCanvas.tsx` | preview canvas, scaled to fit its container |
| `components/padder/target-selector.tsx` | two-way target toggle + resulting `W x H` read-out + crop note |
| `components/padder/padder-actions.tsx` | download PNG, continue to `/padder-outpaint` |
| `components/padder/padder-shell.tsx` | shared header chrome for both routes |
| `components/padder/padder-outpaint-content.tsx` | static prompt page: step cards with copy buttons |
| `app/padder/page.tsx`, `app/padder/layout.tsx` | route + metadata |
| `app/padder-outpaint/page.tsx`, `app/padder-outpaint/layout.tsx` | route + metadata |

Touched existing files:

- `components/HeroSection.tsx` — third secondary link to `/padder`, styled like the existing
  "Automatic building" link, stacked below it.
- `app/sitemap.ts` — entries for `/padder` and `/padder-outpaint` at priority 0.8.

Not touched: `/prep`, `/outpaint`, `/merger`, `/design`, `lib/prep-renderer.ts`,
`hooks/use-prep-workflow.ts`, the watermark pipeline, PSD export.

## Assumptions you should hold

- Users arrive with a Scryfall download, so the input is portrait and no larger than the 1200 DPI
  tier. Landscape or oversized input is handled by the no-tier-fits error, not by rotation logic.
- Image files are the same formats the rest of the app already accepts; reuse whatever upload
  handling `/prep` uses rather than inventing new validation.
- Only PNG export is needed. No PSD, no JPEG, no clipboard copy.
- The two pad targets are the whole set. Adding a third later means one entry in `PAD_TARGETS`.

## Suggested order of work

Each step is a full RED -> GREEN -> REFACTOR cycle, tests first, per the project's TDD rules.

1. **Pad math** — tiers, targets, `selectTier` (including no-fit), `computePadLayout` for both
   targets including the bottom-crop numbers and the reported cropped-pixel count.
2. **Renderer** — grey fill plus native-size image draw at the computed offset; full-resolution
   export canvas.
3. **Prompts module** — `PADDER_TARGET_KEY`, placeholder handshake builder taking width, height
   and ratio label, placeholder command.
4. **Workflow hook** — upload, target select, derived layout, error state, downloaded flag,
   analytics `track` calls in line with the neighbouring hooks, sessionStorage write of the target.
5. **Preview + selector components** — `PadderCanvas`, `target-selector` with the size read-out
   and crop note.
6. **Page assembly** — `padder-page-content`, `padder-actions`, `padder-shell`, `app/padder/*`.
7. **Prompt page** — `padder-outpaint-content` reading the stored target, `app/padder-outpaint/*`.
8. **Entry points** — hero link and sitemap entries.

## Conventions that apply

The project's rules in `CLAUDE.md` govern: `pnpm` only, tests alongside source (`__tests__/` for
components and hooks, inline for `lib/`), 100% coverage enforced, behaviour-first assertions (no
asserting on copy or CSS class names — use `data-*`, `aria-*`, `disabled`, element presence,
callbacks), no arbitrary Tailwind values, `@/` imports, named exports except `page.tsx`.
Never run `pnpm dev` or `pnpm build`; `pnpm test` and `pnpm lint:ts` only.
