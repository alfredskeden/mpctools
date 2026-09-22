# Definition of Done: Padder Batch Mode

## How this work is verified

The project fixes the method, so this strategy follows it: Vitest 4 with
`@testing-library/react`, tests written first in RED → GREEN → REFACTOR cycles, 100% coverage
enforced on statements, branches, functions and lines, and behaviour-first assertions — no
asserting on user-visible copy or CSS class names.

Two kinds of evidence appear below:

- **Automated** — a Vitest test. The only evidence accepted for behaviour.
- **Type/lint** — `pnpm lint:ts` and the ESLint rules.

There is deliberately **no manual pass** in this plan. The one thing that costs is external
archive-tool compatibility, so item 21 covers it from the other side: the produced ZIP bytes
are parsed back in a test rather than trusted.

The work is done when every item below holds.

## File collection (automated)

1. A `FileList` of mixed contents yields only the image files; a `.DS_Store`, a text file and
   an extension-less file are dropped without appearing anywhere in the result.
2. An empty selection yields an empty list rather than throwing.
3. A dropped folder is walked recursively: files nested two levels deep are collected, and the
   result is flat — no directory information survives.
4. A drop carrying plain files rather than entries falls back to `dataTransfer.files` and
   collects them.
5. A drop carrying neither entries nor files yields an empty list rather than throwing.
6. A directory entry whose reader returns its children across multiple batches is fully walked,
   not truncated at the first batch.
7. Collection order is stable and matches the order the browser supplied.

## The batch loop (automated)

8. Files are processed strictly in order, one at a time — asserted by recording the call
   sequence of the injected decode step, and by the fact that a step is never entered before
   the previous file's release has run.
9. A successful file produces an entry carrying the padded PNG blob, the layout's canvas
   dimensions and its cropped-pixel count.
10. A file whose decode rejects is classified as an unreadable failure; the loop continues to
    the next file.
11. A file whose dimensions make `computePadLayout` return `null` is classified as a
    not-a-portrait-scan failure; the loop continues.
12. Every file releases its object URL — after success, after a decode failure, and after a
    layout failure alike.
13. Progress is reported once per file with the processed count, the total and the current
    name.
14. Cancellation between files stops the run: the remaining files are never decoded, and the
    entries already produced are still returned.
15. A batch in which every file fails returns no entries and a failure per file.
16. A file that decodes but whose canvas yields no blob is a failure, not a silently empty ZIP
    entry.

## ZIP building (automated)

17. Entry names come from the existing `paddedFileName`, so a `card.png` becomes
    `padded_card.png`.
18. A name already taken is de-duplicated with a numeric suffix before the extension, and a
    third collision increments again.
19. De-duplication does not alter the first occurrence of a name.
20. The ZIP is produced from the entries in batch order.
21. The produced ZIP blob parses as a real archive: its bytes start with the local file header
    signature, it contains one entry per success with the expected names, and a stored entry's
    payload round-trips back to the exact bytes handed in. This replaces opening the file in an
    external tool.
22. The download helper hands the blob to an anchor with an object URL, names the file
    `padded-scans.zip`, and revokes the URL afterwards.

## Batch hook (automated)

23. Adding files creates one pending row per file, preserving order.
24. Adding files again replaces the previous set rather than appending a second batch.
25. Per-file results update only the matching row; other rows keep their status.
26. Derived counts — total, done, failed, pending — follow the rows and are consistent at every
    point of a partial run.
27. Cancelling mid-run leaves processed rows in their terminal state and the rest pending, and
    the hook reports the run as no longer active.
28. Reset clears rows, counts and progress back to the empty state.
29. The hook takes the target as an argument: changing the target changes the layouts used by a
    subsequent run without the hook holding a target of its own.
30. Analytics `track` is called for a batch run and for a ZIP download, in line with the
    neighbouring hooks.

## Batch UI (automated)

31. The batch panel before any selection offers the input affordances and no export.
32. The folder affordance is present when `webkitdirectory` is supported and absent when it is
    not — asserted through the feature check, not through styling.
33. Dropping files on the zone adds rows; the page does not navigate (the drop and dragover
    handlers prevent default), following the dewatermark precedent.
34. Each row exposes its name and, once processed, its canvas dimensions and cropped-pixel
    count; a cropped-pixel count of zero is not surfaced.
35. A failed row is distinguishable from a done row through an ARIA/state attribute rather than
    styling, and surfaces which of the two failure kinds it was.
36. The summary counts rendered on the page match the hook's derived counts during a partial
    run.
37. Export is offered when at least one file has succeeded, and is not offered when zero have.
38. Cancel is offered only while a run is active.
39. Triggering export calls the ZIP path with the successful entries only.

## Mode switching (automated)

40. `/padder` opens in single mode: the existing upload affordance is present and the batch
    panel is not.
41. Switching to batch mode renders the batch panel and removes the single-scan preview and its
    download affordance; switching back restores them.
42. The target selector is present in both modes, and a target chosen in one mode is still
    selected after switching to the other.
43. Batch mode writes nothing to session storage under `PADDER_TARGET_KEY`, and offers no
    continue-to-scrub affordance.
44. Single mode's existing behaviour is unchanged — the whole pre-existing
    `padder-page-content` suite still passes without its assertions being rewritten to
    accommodate the toggle.
45. Batch mode still exposes no control that changes image scale, position or canvas size,
    asserted by absence, matching the single flow's guarantee.

## Whole-suite gates

46. `pnpm test` passes with zero failures; the test count and pass rate are stated when the
    work is handed back.
47. `pnpm test:coverage` meets the enforced 100% thresholds, with `/* v8 ignore */` used only
    for genuinely browser-only branches, matching existing usage.
48. `pnpm lint:ts` reports no TypeScript errors.
49. No `className` contains an arbitrary Tailwind value — the ESLint rule passes.
50. `client-zip` is the only dependency added, and it is a runtime dependency in
    `package.json`.
