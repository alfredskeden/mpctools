# Scryfall Scan Padder

## Outcome

A third entry point on the landing page, "Scryfall scan padder", leading to `/padder`: the
user uploads a Scryfall-downloaded card scan, picks one of two print targets, and downloads a
PNG in which the scan sits at its **exact original pixel size**, centered, on a `#808080` grey
canvas sized to the MPC print target. There are no transform controls — no drag, no zoom, no
canvas inputs. The correct padding is computed, not configured.

A companion static page `/padder-scrub` tells the user which prompts to feed Gemini for a
padded scan, mirroring how `/outpaint` does it for the Prep flow.

## Why

`/prep` is built for source artwork of unknown size: it scales the image to fit a canvas the
user configures. A Scryfall scan is the opposite case — it is already at a known, correct
resolution, and any scaling is destructive resampling. What the user needs is purely additive:
keep every pixel, surround it with the exact amount of grey that turns the scan into an MPC
print-size canvas, hand it to Gemini to fill that grey. Doing this in `/prep` today means
fighting the scale controls to land on numbers the app could just compute.

## The pad math

**The bleed is a ratio, not a fixed size.** A Scryfall scan is a trimmed card at
*some* resolution; MPC needs that same card with print bleed around it. Those two
sizes are related by a fixed ratio, taken from the confirmed 300 DPI reference pair:

| | Width | Height |
| --- | --- | --- |
| `CARD_REFERENCE` — card, no bleed | 745 | 1040 |
| `BLEED_REFERENCE` — same card, with bleed | 816 | 1110 |

**Canvas derivation.** The canvas is the scan grown by that ratio, never a fixed
target the scan is padded up to:

```
canvasW = max(round(imgW * 816 / 745), round(imgH * 816 / 1040), imgW)
canvasH = round(canvasW * 1110 / 816)
```

Taking the max of both axes means neither edge is ever clipped. The image is then
centred at native size: `x = floor((canvasW - imgW) / 2)`, `y = floor((canvasH - imgH) / 2)`.

| Scan | Canvas | Grey pad |
| --- | --- | --- |
| 745 x 1040 (Scryfall png) | 816 x 1110 | 35 / 35 |
| 672 x 936 (Scryfall large) | 736 x 1001 | 32 / 32 |
| 1490 x 2080 (600 DPI card) | 1632 x 2220 | 71 / 70 |
| 1200 x 1680 (between DPI tiers) | 1318 x 1793 | 59 / 56 |

Scans that sit at a standard DPI still land exactly on the MPC print sizes
(816x1110, 1632x2220, ...); those sizes are an *outcome* of the ratio, not an input
to it. Everything else gets the same proportional bleed instead of being inflated
to the next size up.

**Target: MPC default (11:15).** Canvas as derived above, unchanged.

**Target: Classic borderless (29:36).** Same width, same image position, but the
canvas is **cropped from the bottom**: `canvasH = round(canvasW * 36 / 29)`.

| Canvas | 29:36 canvas |
| --- | --- |
| 816 x 1110 | 816 x 1013 |
| 736 x 1001 | 736 x 914 |
| 1632 x 2220 | 1632 x 2026 |

The image keeps the `x`/`y` it had in the default layout. Nothing is re-centered
vertically.

**Bottom crop cuts card art, on purpose.** For a 745x1040 scan the image spans y
35..1075 while the canvas ends at 1013, so the bottom 62px of the card is cut off.
This is the confirmed, intended behaviour and matches the reference output. Report
the number in the UI (see below) so it is never a surprise, but do not clamp,
warn-block, or shift the image up to avoid it.

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

**Nothing is ever resampled.** The scan's own resolution sets the output resolution;
only the amount of grey changes. Input that is not a portrait card scan (landscape,
square, zero-sized) is refused with an error and offers no download — it is never
rotated or scaled to fit.

**Handoff to `/padder-scrub` via its own sessionStorage key.** `/padder` writes
`{ width, height, ratioLabel }` under a new `PADDER_TARGET_KEY`. `/padder-scrub` reads it to
fill the prompt's size and ratio, falling back to the 300 DPI default target when absent. Read it
in an effect or a lazy `useState` initialiser guarded by try/catch — never during SSR — following
how `components/outpaint/outpaint-page-content.tsx` already does it.

**`/padder-scrub` ships three prompts, all final copy.** `lib/padder-prompts.ts` exports
`buildPadderHandshakePrompt` and `buildPadderCommand` — both substituting the selected target's
declared ratio label — plus `PADDER_ALTERNATE_COMMAND`, a short one-line alternative offered
under an "or" divider. The prompts do not reuse `/outpaint`'s wording.

**Chrome is shared between the two padder routes.** One `PadderShell` component with a small
header (link home, route title, a two-step "Pad -> Scrub" indicator) used by both routes'
layouts, modelled on `app/design/layout.tsx`. The 3-step `Header` from the `(steps)` group does not
apply and `/padder` must stay outside that route group.

**Export is a full-resolution PNG.** Render the layout into an offscreen canvas at true canvas
pixel size and download via `downloadCanvasAsBlob` as `padded_<original-name>.png`. The on-screen
preview is a separately scaled render; it is never the download source.

## Where the work lands

New files, each with tests per the project's placement rules:

| File | Contents |
| --- | --- |
| `lib/padder-math.ts` (+ inline `.test.ts`) | `CARD_REFERENCE`, `BLEED_REFERENCE`, `PAD_TARGETS`, types, `computePadLayout` |
| `lib/padder-renderer.ts` (+ inline `.test.ts`) | `renderPadScene(ctx, image, layout)`, `exportPaddedCanvas(image, layout)` |
| `lib/padder-prompts.ts` (+ inline `.test.ts`) | handshake + command builders, alternate command, `PADDER_TARGET_KEY` |
| `hooks/use-padder-workflow.ts` (+ `hooks/__tests__/`) | reducer, upload, target select, downloaded flag, derived layout, error state |
| `hooks/use-paste-image.ts` (+ `hooks/__tests__/`) | window paste listener handing the first clipboard image to a callback |
| `components/padder/padder-page-content.tsx` | orchestrator: drop zone, target toggle, preview, actions |
| `components/padder/PadderCanvas.tsx` | preview canvas, scaled to fit its container |
| `components/padder/target-selector.tsx` | two-way target toggle + resulting `W x H` read-out + crop note |
| `components/padder/padder-actions.tsx` | download PNG, continue to `/padder-scrub` |
| `components/padder/padder-shell.tsx` | shared header chrome for both routes |
| `components/padder/padder-scrub-content.tsx` | static prompt page: step cards with copy buttons |
| `app/padder/page.tsx`, `app/padder/layout.tsx` | route + metadata |
| `app/padder-scrub/page.tsx`, `app/padder-scrub/layout.tsx` | route + metadata |

Touched existing files:

- `components/HeroSection.tsx` — third secondary link to `/padder`, styled like the existing
  "Automatic building" link, stacked below it.
- `app/sitemap.ts` — entries for `/padder` and `/padder-scrub` at priority 0.8.

Not touched: `/prep`, `/outpaint`, `/merger`, `/design`, `lib/prep-renderer.ts`,
`hooks/use-prep-workflow.ts`, the watermark pipeline, PSD export.

## Assumptions you should hold

- Users always arrive with a Scryfall card scan at the standard MTG card aspect ratio, at
  whatever resolution Scryfall served. There is no upper size limit. Landscape or square input
  is handled by the not-a-portrait-scan error, not by rotation logic.
- Image files are the same formats the rest of the app already accepts; reuse whatever upload
  handling `/prep` uses rather than inventing new validation. A scan can also arrive by paste —
  the same load path, so a Scryfall image copied in the browser never has to be downloaded first.
- Only PNG export is needed. No PSD, no JPEG, no clipboard copy.
- The two pad targets are the whole set. Adding a third later means one entry in `PAD_TARGETS`.

## Suggested order of work

Each step is a full RED -> GREEN -> REFACTOR cycle, tests first, per the project's TDD rules.

1. **Pad math** — bleed reference pair, targets, `computePadLayout` for both targets including
   the bottom-crop numbers and the reported cropped-pixel count.
2. **Renderer** — grey fill plus native-size image draw at the computed offset; full-resolution
   export canvas.
3. **Prompts module** — `PADDER_TARGET_KEY`, handshake and command builders taking the target's
   declared ratio label, plus the short alternate command.
4. **Workflow hook** — upload, target select, derived layout, error state, downloaded flag,
   analytics `track` calls in line with the neighbouring hooks, sessionStorage write of the target.
5. **Preview + selector components** — `PadderCanvas`, `target-selector` with the size read-out
   and crop note.
6. **Page assembly** — `padder-page-content`, `padder-actions`, `padder-shell`, `app/padder/*`.
7. **Prompt page** — `padder-scrub-content` reading the stored target, `app/padder-scrub/*`.
8. **Entry points** — hero link and sitemap entries.

## Conventions that apply

The project's rules in `CLAUDE.md` govern: `pnpm` only, tests alongside source (`__tests__/` for
components and hooks, inline for `lib/`), 100% coverage enforced, behaviour-first assertions (no
asserting on copy or CSS class names — use `data-*`, `aria-*`, `disabled`, element presence,
callbacks), no arbitrary Tailwind values, `@/` imports, named exports except `page.tsx`.
Never run `pnpm dev` or `pnpm build`; `pnpm test` and `pnpm lint:ts` only.
