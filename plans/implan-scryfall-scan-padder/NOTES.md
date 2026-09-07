# Notes

## Confirmed by the person who asked for this work

- Only two pad targets: MPC default (11:15-ish) and Classic borderless (29:36).
- Padding is derived from a bleed *ratio*, fixed by one reference pair: a 745x1040
  trimmed card sits inside an 816x1110 canvas with bleed. Superseded the original
  design, which padded every scan up to the nearest of four fixed sizes
  (816x1110, 1632x2220, 2176x2960, 3264x4440).
- Why it changed: a 672x936 Scryfall "large" jpg is a ~268 DPI card. Padded up to the
  300 DPI 816x1110 canvas it got 72px/87px of grey instead of a bleed. Confirmed by the
  person who asked for this work: the input is always an MTG card at the Scryfall
  aspect ratio, so keep the ratio, keep the resolution, and only add the right grey.
  Those four fixed sizes still fall out of the ratio when a scan is at a standard DPI.
- No scaling, ever — not up to a reference size, not down to fit. The scan's own
  resolution is the output resolution.
- No slider. One computed canvas per target. The user never moves or scales the image.
- 29:36 is produced by cropping the default canvas **from the bottom only**. This cuts
  real card art (62px off a 745x1040 Scryfall scan). Called out as a tradeoff and
  confirmed anyway — the reference output image shows exactly that bottom cut.
- Routes: `/padder` (tool) and `/padder-scrub` (static prompt-instruction page).
- `/padder-scrub` prompt copy is final, supplied verbatim: a "Digital TCG Restorer &
  Atmospheric Extender" handshake, a "Neutral Extension" command, and a short one-line
  alternative offered under an "or" divider. The aspect ratio inside both the handshake
  and the command is substituted from the target chosen on `/padder`.
- Landing hero gets a third link ("Scryfall scan padder") below "Automatic building",
  same secondary-link styling.

## Input

- A scan can arrive by upload **or** by paste (`hooks/use-paste-image.ts`), so an image copied
  straight from Scryfall skips the download-then-upload trip. Both paths share one load path,
  and paste works whether or not a scan is already loaded — it replaces it.

## Naming

- The second route is **Scrub**, not Outpaint: `/padder-scrub`, and the header lets the
  user move between Pad and Scrub directly.
- The default target is labelled just "Default" (not "MPC default"), and the toggle's
  heading is "Select aspect ratio" (not "Print target").

## Observations from reading the code

- `#808080` grey already lives in `lib/canvas-utils.ts` as `BG_COLOR`, and the existing
  Gemini handshake prompt names `#808080` as the work zone. Same grey, no new token.
- `buildHandshakePrompt(w, h)` in `hooks/use-outpaint-workflow.ts` derives the ratio label
  by gcd. `816x1110` reduces to `136:185`, which is useless in a prompt — the padder must
  pass a declared ratio label instead of relying on gcd.
- `/design` shows the pattern for a route outside the `(steps)` route group with its own
  header chrome; the 3-step `Header` is wrong for the padder.
- Prior plan `plans/implan-native-canvas-sizing/` added a native-image mode to `/prep`
  (image at scale 1, canvas moved instead). Same philosophy, different feature: that one
  is a slider over 11:15 sizes inside Prep; this one is a zero-control standalone route.
  Reuse its pure helpers only where they genuinely fit — mostly they don't.
