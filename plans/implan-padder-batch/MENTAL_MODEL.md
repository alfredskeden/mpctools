# Mental model: Padder Batch Mode

## The one-sentence version

Batch is the single-scan flow run N times in a loop and zipped — same math, same renderer,
no previews, one target, one download.

## What is actually new

Only the outer ring. The core is untouched.

```mermaid
flowchart LR
  subgraph NEW["New in this work"]
    direction TB
    N1["Collect files<br/>folder / multi-select / drop"]
    N2["Sequential loop<br/>+ progress + cancel"]
    N3["ZIP + download"]
    N4["File list UI<br/>+ mode toggle"]
  end
  subgraph OLD["Reused unchanged"]
    direction TB
    O1["computePadLayout"]
    O2["renderPadScene / exportPaddedCanvas"]
    O3["TargetSelector"]
  end
  N2 --> O1
  N2 --> O2
  N4 --> O3
```

If a change starts touching `lib/padder-math.ts`, something has gone wrong — batch is not
supposed to alter padding arithmetic at all.

## The pipeline

```mermaid
flowchart TD
  I["Folder picked / files chosen / folder dropped"] --> F["Filter to image files<br/>(non-images silently dropped)"]
  F --> L["List rows: name only.<br/>Nothing decoded yet."]
  L --> R{"User runs the batch"}
  R --> Loop["For each file, in order"]
  Loop --> D["Object URL -> decode"]
  D -- decode fails --> X1["Row: failed (unreadable)"]
  D -- ok --> M["computePadLayout(dims, target)"]
  M -- null --> X2["Row: failed (not a portrait scan)"]
  M -- layout --> RN["exportPaddedCanvas -> canvas.toBlob"]
  RN --> REL["Release image, canvas, object URL"]
  REL --> ROW["Row: done, canvas size + crop px"]
  X1 --> NXT
  X2 --> NXT
  ROW --> NXT["Next file, or stop if cancelled"]
  NXT --> Loop
  NXT --> Z{"Any successes?"}
  Z -- yes --> ZIP["client-zip -> padded-scans.zip"]
  Z -- no --> NONE["Nothing to download;<br/>list explains each failure"]
```

## Two kinds of rejection

They look similar and are not. Keeping them apart is what makes the failure list useful.

| Input | Treatment | Why |
| --- | --- | --- |
| `.DS_Store`, `notes.txt`, any non-image | Filtered out, never listed | Was never a candidate; listing it is noise |
| Image that will not decode | Listed as failed | The user gave us a scan and it did not work |
| Image that is landscape, square or zero-sized | Listed as failed | `computePadLayout` returns `null`; same rule as single mode |

A failed file never blocks the rest. Export is offered whenever at least one file succeeded.

## Why one file at a time

Peak memory, not speed, sets the design.

A decoded image and a full-size canvas both live in RAM; a PNG blob does not — the browser
backs blobs with disk. So the loop holds exactly one image and one canvas at any moment, and
keeps only blobs between iterations.

```mermaid
flowchart LR
  A["decode<br/>(RAM)"] --> B["canvas<br/>(RAM)"] --> C["blob<br/>(disk-backed)"] --> D["release A and B"]
  D --> A
```

Doing all decodes up front would hold N images and N canvases at once — a 50-scan folder at
600 DPI would be gigabytes.

## Why the list is empty at first

Picking a folder records names only. Dimensions, canvas size, crop pixels and status appear
row by row as the run reaches each file.

That makes the file list *also* the progress display — there is no separate progress
component to keep in sync, and choosing a 200-file folder never stalls the page.

## Where the target lives

```mermaid
flowchart TD
  PC["padder-page-content.tsx<br/>owns: mode, target"]
  PC --> TS["TargetSelector<br/>(rendered once, both modes)"]
  PC --> S["Single panel<br/>canvas preview, download, scrub handoff"]
  PC --> B["Batch panel<br/>drop zone, file list, ZIP"]
  B --> HK["use-padder-batch<br/>receives target as an argument"]
```

The batch hook never owns the target. That is what stops the two modes from disagreeing about
which ratio is selected.

## The scrub handoff stops at single mode

Single mode stores `{ width, height, ratioLabel }` so `/padder-scrub` can put a real size into
the Gemini prompt. In a batch the scans have different sizes, so there is no single honest
value to store — batch mode writes nothing and offers no Continue-to-Scrub.

Watch the existing effect in `use-padder-workflow.ts`: it writes whenever a layout exists. It
must not fire while batch mode is active.

## Testability shape

`lib/padder-batch.ts` takes its three DOM-touching steps as injected functions with real
defaults:

```
padBatchFiles(files, target, { decode, render, toBlob, onProgress, isCancelled })
```

Loop order, failure classification, progress reporting and cancellation are then plain unit
tests with fake steps — no canvas mocking, no image decoding, and full branch coverage without
`/* v8 ignore */`.
