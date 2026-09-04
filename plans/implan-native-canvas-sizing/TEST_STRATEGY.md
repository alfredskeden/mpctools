# Definition of Done

The work is finished when every item below is true. The project already enforces its own bar
(Vitest, 100% coverage on statements/branches/functions/lines, behaviour-first assertions), so
most items are executable tests; the last group is a manual pass in the browser because it
concerns pixels and pointer feel, which the test suite cannot judge.

## Canvas step math (`lib/canvas-utils.test.ts`)

1. A step count maps to the matching 11:15 size — step 320 produces 3520×4800, step 100
   produces 1100×1500, step 700 produces 7700×10500.
2. Every produced size holds the exact 11:15 ratio (width/11 equals height/15).
3. A width already on the grid maps back to its own step (3520 → 320).
4. A width off the grid maps to the nearest step (3712 → 337, since 3712/11 = 337.45).
5. Widths below and above the range clamp to the minimum and maximum step.

## Mode state (`hooks/__tests__/use-prep-workflow.test.ts`)

6. A fresh workflow starts in the scaled-image mode — the new mode is opt-in.
7. Switching into the new mode sets image scale to exactly 1.
8. Switching into the new mode leaves `position.x` and `position.y` untouched, including when
   the image already sits partly outside the canvas.
9. Switching into the new mode from a non-11:15 canvas snaps the canvas to the nearest legal
   11:15 size; switching in from the default 3520×4800 leaves the canvas unchanged.
10. Switching back out of the new mode restores the previous mode and leaves the canvas size
    and image scale as the new mode left them.
11. Changing the step while in the new mode sets the canvas to the corresponding 11:15 size.
12. Changing the step shifts the image position so its offset from the canvas centre is
    unchanged — verified both growing and shrinking, and with an image that was manually
    dragged off-centre.
13. Changing the step never alters image scale.
14. Uploading an image while the new mode is active leaves scale at 1 and centres the image in
    the current canvas.
15. Uploading an image in the default mode still auto-fits as it does today (existing tests
    keep passing, unmodified).
16. Both new hook callbacks fire their analytics `track` calls.

## Canvas Size panel (`components/prep/toolbar/__tests__/CanvasSizePanel.test.tsx`)

17. The mode toggle is present and reflects the active mode through a state attribute, not a
    class name.
18. In the default mode the W/H inputs and the preset buttons are rendered and the step slider
    is absent.
19. In the new mode the step slider is rendered and the W/H inputs and preset buttons are
    absent.
20. The slider's value corresponds to the current canvas width, and its min/max match the
    step bounds.
21. Moving the slider invokes the step callback with the new step value.
22. The panel shows the resulting canvas dimensions for the current step.

## Disabled scale controls

23. In the new mode, the zoom/scale slider, the image dimension inputs, `Fit width` and
    `Fit height` in `ImageControlsPanel` are all disabled; in the default mode they are
    enabled (`components/prep/toolbar/__tests__/ImageControlsPanel.test.tsx`).
24. Controls that only affect position or appearance — rotation, position nudges, centre
    horizontal/vertical, vertical presets, keep-aspect-ratio, algorithm — stay enabled in both
    modes.
25. `DpiOverridePanel` renders its controls disabled when given the disabled flag and enabled
    without it (`components/prep/toolbar/__tests__/DpiOverridePanel.test.tsx`).
26. `PrepToolbar` and `MobileAdvancedOptions` pass the new callbacks and the DPI disabled flag
    through to their panels.

## Project gates

27. `pnpm test` passes with no skipped or failing tests; the run's test count and pass rate are
    reported.
28. `pnpm test:coverage` meets the enforced 100% thresholds — every new branch, including both
    modes of every conditional, is exercised.
29. `pnpm lint:ts` compiles with no errors, and lint reports no arbitrary Tailwind values in the
    new markup.
30. No new assertion in any of the above depends on user-visible copy or on a CSS class name.

## Manual pass in the browser

Run against the existing dev setup on port 3050 (the developer starts it; the implementer does
not run `pnpm dev`).

31. With an image uploaded and the new mode switched on, the image renders at its native pixel
    size — a 1500-tall source fills exactly 1500 canvas pixels of a 4800-tall canvas.
32. Dragging the slider grows and shrinks the grey border evenly around the image, with no
    visible jump or re-scale of the image itself.
33. At small step values the image visibly overflows the grey canvas, and the downloaded PNG
    contains only the part that fell inside.
34. The downloaded PNG's pixel dimensions equal the selected 11:15 size, and the image region
    inside it is pixel-identical to the source (no resampling softness).
35. Dragging the image with the pointer still works in the new mode, and the resulting offset
    survives a subsequent slider move.
36. The default mode is unchanged end to end: upload, auto-fit, presets, W/H inputs, DPI
    override, download.
37. The Outpaint step still picks up the canvas size chosen in the new mode from session
    storage.
