# Notes

## Confirmed by the person who asked for this work

- Only two pad targets: MPC default (11:15-ish) and Classic borderless (29:36).
- Padding target sizes come from MPC print specs (800 DPI, 2.48" x 3.46"), expressed
  per DPI tier: 816x1110 (300), 1632x2220 (600), 2176x2960 (800), 3264x4440 (1200).
- No slider. One computed canvas per target. The user never moves or scales the image.
- 29:36 is produced by cropping the default canvas **from the bottom only**. This cuts
  real card art (62px off a 745x1040 Scryfall scan). Called out as a tradeoff and
  confirmed anyway — the reference output image shows exactly that bottom cut.
- Routes: `/padder` (tool) and `/padder-outpaint` (static prompt-instruction page).
- `/padder-outpaint` prompt copy is deliberately a placeholder. Final wording will be
  pasted in later; do not invent it.
- Landing hero gets a third link ("Scryfall scan padder") below "Automatic building",
  same secondary-link styling.

## Open question still owed

- Final prompt text for `/padder-outpaint` (handshake + command). Placeholder constants
  ship with a clearly marked TODO.

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
