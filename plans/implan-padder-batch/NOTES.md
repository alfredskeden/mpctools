# Notes

## Confirmed by the person who asked for this work

- Batch lives **inside `/padder`** as a mode toggle (single / batch), not a new route.
- Output is **one ZIP download**. No sequential per-file downloads, no writing to disk.
- **One aspect-ratio target for the whole batch.** No per-file override.
- Input: folder picker (`webkitdirectory`), multi-file select, and folder-aware drag & drop.
  **File System Access API (`showDirectoryPicker`) is explicitly out** — the output is a ZIP,
  so a writable directory handle buys nothing, and it is Chromium-only and awkward to cover
  under the repo's 100% coverage rule.
- A file that is not a portrait card scan (landscape, square, zero-sized, corrupt, non-image)
  is **skipped and listed as failed** with a reason. The rest of the batch still exports.
- Batch UI is a **file list with counts** — name, source size, canvas size, crop px, status.
  No thumbnails, no canvas previews; rendering N canvases for 600 DPI scans is the thing to
  avoid.
- **No `/padder-scrub` handoff in batch mode.** Batch is export-only; the sessionStorage write
  and the Continue-to-Scrub action stay single-file behaviour.
- ZIP built with the **`client-zip`** dependency (~3KB ESM, streaming, handles CRC32/zip64).
  Not jszip, not hand-rolled.
- Processing is **sequential on the main thread with a progress read-out**. No Web Worker.

## Observations from reading the code

- `computePadLayout(image, target)` in `lib/padder-math.ts` is already DOM-free and already
  returns `null` for non-portrait input. Batch needs no new math — it needs a loop, a failure
  list, and a ZIP.
- `exportPaddedCanvas(image, layout)` returns an `HTMLCanvasElement`. Single mode then calls
  `downloadCanvasAsBlob`, which goes through `canvas.toDataURL`. Batch needs a real `Blob`
  per entry, so it uses `canvas.toBlob` instead — a base64 data URL per file would multiply
  peak memory for no reason.
- `paddedFileName()` already produces `padded_<name>.png` and is reused verbatim for ZIP
  entry names. Collisions are possible once nested folders are in play (two folders each
  holding `card.png`), so entry names must be de-duplicated.
- Single mode loads images via `FileReader` → data URL → `new Image()` in
  `components/padder/padder-page-content.tsx`. For batch, `URL.createObjectURL` +
  `revokeObjectURL` after decode is the memory-safe equivalent.
- `components/dewatermark/dewatermark-page-content.tsx` is the existing drag & drop
  precedent (window-level `drop`/`dragover` listeners), and its test file shows how this repo
  fakes drag events (`Object.defineProperty(evt, "dataTransfer", …)`). Nothing in the repo
  walks a dropped *folder* yet — `webkitGetAsEntry` traversal is new.
- The padder hook writes `PADDER_TARGET_KEY` to sessionStorage in an effect whenever a layout
  exists. Batch mode must not trip that effect.

## Open / watch out for

- `croppedPixels` is per-scan and varies with resolution. In a batch the list should show it
  per row rather than a single batch-wide number.
- Peak memory is the real risk: decode → full-size canvas → PNG blob, held until the ZIP is
  built. Blobs are backed by disk by the browser, decoded images and canvases are not — so
  release each image and canvas before moving to the next file.
- The prior plan's retro flagged that the bleed ratio rests on one unvalidated reference pair
  (745x1040 → 816x1110). Batch inherits that risk unchanged; it does not add to it.

## Verification stance

- **No manual pass in this plan.** Confirmed by the person who asked for this work: everything
  is proved by Vitest, `pnpm lint:ts` and the coverage gate.
- The gap that would normally need a human — "does this ZIP open in a real archive tool" — is
  closed from the other side instead: the produced ZIP blob is parsed back in a test
  (`TEST_STRATEGY.md` item 21), checking the local file header signature, the entry names, and
  a stored entry round-tripping to the exact bytes handed in.
- Mental model is markdown only; no HTML rendering was wanted.
