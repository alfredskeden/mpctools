# Definition of Done: Scryfall Scan Padder

## How this work is verified

The project already fixes the method, so this strategy follows it rather than inventing one:
Vitest 4 with `@testing-library/react`, tests written first in RED -> GREEN -> REFACTOR cycles,
100% coverage enforced on statements, branches, functions and lines, and behaviour-first
assertions — no asserting on user-visible copy or CSS class names.

Three kinds of evidence appear below:

- **Automated** — a Vitest test. The default, and the only acceptable evidence for the pad math.
- **Type/lint** — `pnpm lint:ts` and the ESLint rules.
- **Manual** — one visual pass with a real Scryfall download, because "the grey looks right and
  the card is not resampled" is a judgement a canvas mock cannot make.

The work is done when every item below holds.

## Pad math (automated)

1. A 745x1040 scan produces the 816x1110 reference canvas — the bleed reference pair round-trips.
2. A 672x936 Scryfall "large" jpg produces a 736x1001 canvas with 32px/32px of grey, not the
   72px/87px it got when padded up to a fixed 816x1110.
3. A 1200x1680 scan — a resolution sitting between the standard DPI steps — produces a
   1318x1793 canvas with 59px/56px of grey, rather than being inflated to the next size up.
4. The grey border is proportionally the same at any resolution: the same card at 745x1040 and
   at 1490x2080 yields the same margin-to-canvas ratio.
5. The canvas holds the MPC bleed aspect ratio (816:1110) regardless of the scan's own ratio.
6. The canvas is never narrower than the scan, whichever axis drives the derivation — verified
   for a width-driven and a height-driven scan, with a non-negative x in both.
7. For the classic borderless target the canvas height is `round(canvasW * 36 / 29)` — checked
   at 816 (1013) and at 736 (914).
8. For the classic borderless target the image position is identical to the default target's
   position; the image is not re-centered in the shorter canvas.
9. The layout reports the number of image pixels falling below the canvas bottom edge: 62 for a
   745x1040 scan, and 0 when the scan is short enough to fit the cropped canvas.
10. Odd-numbered leftovers floor rather than producing fractional offsets, so no layout ever
    carries a non-integer x or y.
11. Input that is not a portrait card scan — landscape, square, or zero-sized — yields no layout
    rather than a rotated, scaled, or degenerate one.
12. The scan's own dimensions survive into the layout untouched; nothing is ever resampled.

## Rendering and export (automated)

13. A rendered scene fills the whole canvas with `#808080` before drawing the image, reusing
    `BG_COLOR` rather than a second literal.
14. The image is drawn once, at its native width and height, at the layout's x and y — no scale
    factor, no rotation, no smoothing-dependent resize call.
15. The export canvas is created at the layout's full canvas pixel size, independent of any
    preview dimensions.
16. The download filename derives from the uploaded file's name, with the extension replaced,
    and falls back to a fixed name when the file name is absent.

## Route behaviour (automated)

17. `/padder` before upload shows the upload affordance and offers no download.
18. After upload, the resulting canvas dimensions and the selected ratio label are both readable
    from the page.
19. Switching the target toggle changes the reported canvas dimensions and ratio label, with the
    active target exposed through an ARIA state attribute rather than styling.
20. Selecting the classic borderless target surfaces the cropped-pixel count when it is non-zero,
    and does not surface it when it is zero.
21. A non-portrait image surfaces the error state and keeps the download disabled.
22. Triggering the download calls the shared download helper and marks the workflow downloaded;
    the continue-to-scrub affordance becomes available.
23. `/padder` contains no control that changes image scale, position or canvas size — asserted by
    the absence of those affordances, so a future accidental reintroduction fails the suite.
24. Downloading writes the target's width, height and ratio label to session storage.
25. `/padder-scrub` builds its prompt from the stored target when present, and from the 300 DPI
    default target when session storage is empty or unparsable.
26. `/padder-scrub` offers three copy affordances — handshake, command, and the short
    alternative — and each reaches the clipboard. The handshake and command carry the declared
    ratio label, never a gcd-reduced one such as `136:185`; the alternate carries no ratio.
27. Neither padder page renders the 3-step Prep/Outpaint/Merge indicator.
28. The landing hero exposes a link to `/padder` alongside the existing `/prep` and `/design`
    links, verified by `href`.
29. The sitemap includes `/padder` and `/padder-scrub`.

## Whole-suite gates

30. `pnpm test` passes with zero failures, and the reported test count and pass rate are stated
    when the work is handed back.
31. `pnpm test:coverage` meets the enforced 100% thresholds, with `/* v8 ignore */` used only for
    genuinely browser-only branches, matching existing usage.
32. `pnpm lint:ts` reports no TypeScript errors.
33. No `className` contains an arbitrary Tailwind value — the ESLint rule passes.

## Manual pass (once, at the end)

34. A real Scryfall 745x1040 png padded at MPC default produces a 816x1110 PNG whose card art is
    pixel-identical to the source (checked by opening both at 100% and comparing edges), with an
    even mid-grey border. A 672x936 "large" jpg of the same card produces a 736x1001 PNG whose
    grey border looks proportionally identical — this is the case the fixed-size design got wrong.
35. The same scan at classic borderless produces an 816x1013 PNG matching the reference output:
    grey on three sides, card cut at the bottom.
36. Both PNGs, fed to Gemini with the `/padder-scrub` prompts, are accepted and the grey zone
    is what gets filled, with the card's frame and text scrubbed away.
