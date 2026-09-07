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

1. A 745x1040 image selects the 300 DPI tier; a 672x936 image selects it too.
2. An image whose width or height exceeds a tier moves up to the next tier that contains both
   dimensions — verified across all four tiers, including the exact-fit boundary where the image
   equals a tier's dimensions and that tier is chosen rather than the next one up.
3. An image larger than 3264x4440 in either dimension yields the no-tier-fits result, and no
   layout, rather than a scaled-down fit.
4. For the MPC default target the canvas equals the selected tier exactly.
5. For the MPC default target a 745x1040 image is placed at x = 35, y = 35, giving equal grey on
   all four sides.
6. For the classic borderless target the canvas width equals the tier width and the height is
   `round(tierW * 36 / 29)` — checked at all four tiers (1013, 2026, 2701, 4052).
7. For the classic borderless target the image position is identical to the default target's
   position; the image is not re-centered in the shorter canvas.
8. The layout reports the number of image pixels falling below the canvas bottom edge: 62 for a
   745x1040 scan at 300 DPI, and 0 when the image is short enough to fit the cropped canvas.
9. Odd-numbered leftovers floor rather than producing fractional offsets, so no layout ever
   carries a non-integer x or y.

## Rendering and export (automated)

10. A rendered scene fills the whole canvas with `#808080` before drawing the image, reusing
    `BG_COLOR` rather than a second literal.
11. The image is drawn once, at its native width and height, at the layout's x and y — no scale
    factor, no rotation, no smoothing-dependent resize call.
12. The export canvas is created at the layout's full canvas pixel size, independent of any
    preview dimensions.
13. The download filename derives from the uploaded file's name, with the extension replaced,
    and falls back to a fixed name when the file name is absent.

## Route behaviour (automated)

14. `/padder` before upload shows the upload affordance and offers no download.
15. After upload, the resulting canvas dimensions and the selected ratio label are both readable
    from the page.
16. Switching the target toggle changes the reported canvas dimensions and ratio label, with the
    active target exposed through an ARIA state attribute rather than styling.
17. Selecting the classic borderless target surfaces the cropped-pixel count when it is non-zero,
    and does not surface it when it is zero.
18. An image too large for every tier surfaces the error state and keeps the download disabled.
19. Triggering the download calls the shared download helper and marks the workflow downloaded;
    the continue-to-outpaint affordance becomes available.
20. `/padder` contains no control that changes image scale, position or canvas size — asserted by
    the absence of those affordances, so a future accidental reintroduction fails the suite.
21. Downloading writes the target's width, height and ratio label to session storage.
22. `/padder-outpaint` builds its prompt from the stored target when present, and from the 300 DPI
    default target when session storage is empty or unparsable.
23. `/padder-outpaint` prompts reach the clipboard through the copy affordances, and its prompt
    text carries the declared ratio label — never a gcd-reduced one such as `136:185`.
24. Neither padder page renders the 3-step Prep/Outpaint/Merge indicator.
25. The landing hero exposes a link to `/padder` alongside the existing `/prep` and `/design`
    links, verified by `href`.
26. The sitemap includes `/padder` and `/padder-outpaint`.

## Whole-suite gates

27. `pnpm test` passes with zero failures, and the reported test count and pass rate are stated
    when the work is handed back.
28. `pnpm test:coverage` meets the enforced 100% thresholds, with `/* v8 ignore */` used only for
    genuinely browser-only branches, matching existing usage.
29. `pnpm lint:ts` reports no TypeScript errors.
30. No `className` contains an arbitrary Tailwind value — the ESLint rule passes.

## Manual pass (once, at the end)

31. A real Scryfall 745x1040 png padded at MPC default produces a 816x1110 PNG whose card art is
    pixel-identical to the source (checked by opening both at 100% and comparing edges), with an
    even mid-grey border.
32. The same scan at classic borderless produces an 816x1013 PNG matching the reference output:
    grey on three sides, card cut at the bottom.
33. Both PNGs, fed to Gemini with the `/padder-outpaint` prompts, are accepted and the grey zone
    is what gets filled. Prompt wording may still be the placeholder at this point; note the
    result rather than blocking on it.
