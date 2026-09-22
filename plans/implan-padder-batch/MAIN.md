# Padder Batch Mode

## Outcome

`/padder` gains a second mode. The user picks a folder of Scryfall scans (or drops one, or
multi-selects files), picks one aspect-ratio target for the whole set, and gets back a single
ZIP of padded PNGs — each scan at its exact original pixel size, centred on the `#808080`
canvas the existing pad math derives for it.

Everything the single-scan flow already does stays exactly as it is. Batch adds a mode toggle,
a file list, a progress read-out and a ZIP export. It adds no new pad math.

## Why

The padder today is one scan at a time: upload, look, download, repeat. Anyone preparing a
whole set of cards runs that loop dozens of times, and every iteration produces one more
download prompt. The math is already fully derived from the scan — nothing about it needs a
human in the loop — so the loop can simply run N times and hand back one file.

## What batch does *not* change

- `computePadLayout` and the bleed-ratio derivation — untouched, reused per file.
- `renderPadScene` / `exportPaddedCanvas` — untouched, reused per file.
- The single-scan flow's behaviour: preview canvas, paste support, target selector, the
  `padded_<name>.png` download, the sessionStorage handoff, Continue to `/padder-scrub`.
- `/padder-scrub` itself, and the prompt modules.
- `/prep`, `/outpaint`, `/merger`, `/design`, the watermark pipeline, PSD export.

## Decisions

**Batch is a mode inside `/padder`, not a route.** One route, one shell, one target selector,
one set of pad math. `padder-page-content.tsx` becomes a thin switch: it owns the mode state
and the target, and renders either the existing single-scan panel or the new batch panel.

**One target for the whole batch.** The existing `TargetSelector` is lifted so both modes use
it. There is no per-file override — that would reintroduce exactly the per-image fiddling the
padder exists to remove.

**No File System Access API.** Input is collected as a plain `File[]` from three sources, all
of which produce the same array and feed one code path:

| Source | Mechanism | Support |
| --- | --- | --- |
| Folder button | `<input type="file" webkitdirectory multiple>` | Chrome, Safari 11.1+, Firefox 50+ |
| Files button | `<input type="file" multiple accept="image/*">` | Everywhere |
| Drag & drop | `DataTransferItem.webkitGetAsEntry()` walked recursively; plain `dataTransfer.files` when entries are unavailable | Everywhere (folder walk: Chromium/WebKit/Firefox) |

Feature-detect with `"webkitdirectory" in HTMLInputElement.prototype` and hide the folder
button when it is false; the files button and drop zone always work. `showDirectoryPicker`
is deliberately not used: the output is a ZIP, so a writable directory handle adds nothing,
and it is Chromium-only.

**Non-images are filtered, bad scans are reported.** Filtering happens in two stages, and the
distinction matters for what the user sees:

- A file whose type is not an image (a `.DS_Store`, a `Thumbs.db`, a text file inside the
  dropped folder) is *filtered out silently* — it was never a candidate.
- A file that is an image but whose decode fails, or whose dimensions make
  `computePadLayout` return `null` (landscape, square, zero-sized), is *listed as failed*
  with its reason. The batch continues; the ZIP holds the successes.

**A failed file never blocks export.** Export is offered whenever at least one file succeeds.
If every file fails, there is nothing to download and the list says why.

**Sequential processing, one file in flight.** For each file in order: create an object URL,
decode it into an `Image`, compute the layout, render into an offscreen canvas at true size,
`canvas.toBlob("image/png")`, then release the image, the canvas and the object URL before
moving on. Only the resulting PNG blobs are retained, and the browser backs blobs with disk.
Progress is reported as "processed / total" plus the current file name, and the run can be
cancelled between files.

**Dimensions are read during processing, not during selection.** Selecting a folder only
records names, sizes and types — cheap, instant, no decoding. A row's canvas size, crop pixels
and pass/fail status appear as its turn comes. This keeps picking a 200-file folder from
stalling the page, and means the list doubles as the progress display.

**Export builds the ZIP with `client-zip`.** New dependency. `downloadZip(entries)` returns a
`Response`; take `.blob()`, hand it to an anchor with an object URL, revoke it after. The ZIP
is named `padded-scans.zip`.

**ZIP entry names are de-duplicated.** Entries are `padded_<original-name>.png` via the
existing `paddedFileName`. Two nested folders can each hold `card.png`, so a name already
taken gets `-2`, `-3`, … inserted before the extension. Folder structure is flattened; the ZIP
has no directories.

**Batch mode writes nothing to sessionStorage.** The `PADDER_TARGET_KEY` write and the
Continue-to-Scrub action belong to single mode, where one canvas size is meaningful. In batch
the sizes differ per scan, so the handoff is simply absent. Take care that the existing effect
in `use-padder-workflow.ts` does not fire while batch mode is active.

**Batch state lives in its own hook.** `use-padder-batch.ts` holds the file rows and their
statuses, the progress counter and the run/cancel controls. It receives the target as an
argument rather than owning it, so the two modes cannot disagree about the target.

**Collection logic is pure and lives in `lib/`.** Turning a `DataTransfer` or a `FileList`
into a filtered `File[]` — including the recursive `webkitGetAsEntry` walk — is a plain
function taking the browser objects as arguments, so it is tested without a DOM.

## How the pieces fit

```
app/padder/page.tsx
  └── padder-page-content.tsx        owns mode + target
        ├── TargetSelector            shared by both modes
        ├── (single)  existing PadderCanvas / PadderActions path, unchanged
        └── (batch)   padder-batch-content.tsx
                        ├── batch-drop-zone.tsx    folder / files / drop
                        ├── batch-file-list.tsx    rows + statuses + counts
                        └── batch-actions.tsx      run, cancel, download ZIP

hooks/use-padder-batch.ts     rows, statuses, progress, run/cancel
lib/file-collection.ts        DataTransfer / FileList  →  filtered File[]
lib/padder-batch.ts           File[] + target  →  { entries, failures }, streamed via callbacks
lib/zip-download.ts           entries  →  padded-scans.zip
lib/padder-math.ts            reused unchanged
lib/padder-renderer.ts        reused unchanged
```

`lib/padder-batch.ts` is where the per-file loop lives. It takes its DOM-touching steps
(decode a `File` into an image, render a layout into a canvas, turn a canvas into a blob) as
injected functions with real defaults, so the loop, the ordering, the failure classification
and the cancellation are all testable without canvas or image decoding.

## Where the work lands

New files, each with tests per the project's placement rules:

| File | Contents |
| --- | --- |
| `lib/file-collection.ts` (+ inline `.test.ts`) | `collectImageFiles(fileList)`, `collectDroppedFiles(dataTransfer)` with recursive entry walk, image-type filter |
| `lib/padder-batch.ts` (+ inline `.test.ts`) | `padBatchFiles(files, target, options)` — sequential loop, per-file result callback, cancellation, failure reasons |
| `lib/zip-download.ts` (+ inline `.test.ts`) | `buildZipBlob(entries)` over `client-zip`, `downloadZipBlob(blob, name)`, entry-name de-duplication |
| `hooks/use-padder-batch.ts` (+ `hooks/__tests__/`) | reducer: add files, per-file status updates, progress, cancel, reset, derived counts |
| `components/padder/padder-batch-content.tsx` (+ `__tests__/`) | batch panel orchestrator |
| `components/padder/batch-drop-zone.tsx` (+ `__tests__/`) | folder button (feature-gated), files button, drop target |
| `components/padder/batch-file-list.tsx` (+ `__tests__/`) | rows: name, source size, canvas size, crop px, status; summary counts |
| `components/padder/batch-actions.tsx` (+ `__tests__/`) | run batch, cancel, download ZIP |

Touched existing files:

- `components/padder/padder-page-content.tsx` — mode toggle; existing single-scan markup moves
  behind the single branch; `TargetSelector` rendered once for both modes.
- `components/padder/__tests__/padder-page-content.test.tsx` — covers both branches.
- `package.json` — add `client-zip`.

## Assumptions you should hold

- A "folder of Scryfall scans" is a flat or nested folder of image files, possibly with junk
  files mixed in. There is no naming convention to rely on.
- Every valid scan is a portrait MTG card at the Scryfall aspect ratio, at whatever resolution
  Scryfall served — same assumption the single flow makes. Batch does not rotate, scale or
  repair anything.
- Batch sizes are tens of files, not thousands. No hard cap is imposed, but the design keeps
  one decoded image in memory at a time so a large folder degrades in time, not in stability.
- PNG only, same as single mode. No JPEG, no PSD.
- The two existing pad targets remain the whole set.

## Suggested order of work

Each step is a full RED → GREEN → REFACTOR cycle, tests first, per the project's TDD rules.

1. **File collection** — `collectImageFiles`, `collectDroppedFiles`, recursive entry walk,
   non-image filtering, empty and malformed input.
2. **ZIP module** — entry-name de-duplication, `buildZipBlob` over `client-zip`,
   `downloadZipBlob`.
3. **Batch loop** — `padBatchFiles`: ordering, per-file success and failure classification
   (decode failure vs non-portrait), progress callbacks, cancellation between files, release
   of object URLs.
4. **Batch hook** — rows and statuses, progress counter, derived counts, cancel, reset,
   analytics `track` calls in line with the neighbouring hooks.
5. **Batch components** — drop zone (with the `webkitdirectory` feature gate), file list,
   actions.
6. **Mode toggle** — rework `padder-page-content.tsx` into the two-branch switch, keeping the
   single path's behaviour and its existing tests intact, and keeping the sessionStorage
   handoff single-mode only.

## Conventions that apply

The project's rules in `CLAUDE.md` govern: `pnpm` only, tests alongside source (`__tests__/`
for components and hooks, inline for `lib/`), 100% coverage enforced, behaviour-first
assertions (no asserting on copy or CSS class names — use `data-*`, `aria-*`, `disabled`,
element presence, callbacks), no arbitrary Tailwind values, `@/` imports, named exports except
`page.tsx`. Never run `pnpm dev` or `pnpm build`; `pnpm test` and `pnpm lint:ts` only.

The prior plan for the single-scan flow is at `plans/implan-scryfall-scan-padder/`; its
`MAIN.md` holds the pad math and its `RETRO.md` the lessons behind it. Read the math section
there before touching anything that looks like padding arithmetic — batch is not supposed to
touch it at all.
