# Mental model: Scryfall Scan Padder

## The one-sentence version

Keep every pixel of the scan; add exactly enough grey around it to make an MPC print-size
canvas — computed, never configured.

## Why it is not just a `/prep` preset

`/prep` scales the image to fit a canvas the user chooses. The padder does the inverse.

```mermaid
flowchart LR
  subgraph P["/prep"]
    P1["User picks canvas"] --> P2["Image scaled to fit"] --> P3["Pixels resampled"]
  end
  subgraph D["/padder"]
    D1["Image dimensions read"] --> D2["Canvas computed from them"] --> D3["Pixels untouched"]
  end
```

Every control that exists to scale or move the image is therefore absent, not merely disabled.

## The pipeline

```mermaid
flowchart TD
  U["Upload scan"] --> T{"Smallest MPC tier<br/>that contains it?"}
  T -- none --> E["Error: image too large.<br/>No download offered."]
  T -- "tier W x H" --> C["Center image in tier<br/>x = floor((tierW - imgW)/2)<br/>y = floor((tierH - imgH)/2)"]
  C --> S{"Selected target"}
  S -- "MPC default 11:15" --> A["Canvas = tier, as-is"]
  S -- "Classic borderless 29:36" --> B["Canvas = tierW x round(tierW*36/29)<br/>cropped from the bottom only"]
  A --> R["Render #808080 + image at (x, y)"]
  B --> R
  R --> DL["Download full-res PNG"]
  R --> H["Store {width, height, ratioLabel}"]
  H --> O["/padder-outpaint reads it<br/>into the Gemini prompt"]
```

## The tiers

Same physical MPC card (2.48in x 3.46in, bleed included) at four resolutions:

| DPI | Tier |
| --- | --- |
| 300 | 816 x 1110 |
| 600 | 1632 x 2220 |
| 800 | 2176 x 2960 |
| 1200 | 3264 x 4440 |

Selection rule: the smallest tier that is at least as wide **and** as tall as the image. A
745x1040 Scryfall png and a 672x936 Scryfall large jpg both pick 816x1110.

## The 300 DPI case, concretely

```mermaid
flowchart LR
  subgraph DEF["MPC default: 816 x 1110"]
    direction TB
    d["grey 35px on all four sides<br/>image 745 x 1040 at (35, 35)"]
  end
  subgraph BOR["Classic borderless: 816 x 1013"]
    direction TB
    b["same image, same (35, 35)<br/>canvas ends at y = 1013<br/>bottom 62px of card cut off"]
  end
```

**The bottom cut is intentional.** 29:36 is wider than the tier ratio, and the crop is
specified to come off the bottom. On a 745x1040 scan that removes 62px of real card art. Show
the number, never work around it.

## What holds state, and what does not

```mermaid
flowchart LR
  subgraph ST["State (the hook)"]
    s1["image element"]
    s2["file name"]
    s3["selected target"]
    s4["downloaded flag"]
  end
  subgraph DR["Derived every render (pure)"]
    d1["tier"]
    d2["canvas W x H"]
    d3["image x, y"]
    d4["cropped-pixel count"]
    d5["error when no tier fits"]
  end
  ST --> DR
```

No stored position, scale, or canvas size. That is why the pad math is testable with no DOM at
all, and why the padding cannot drift out of sync with the selected target.

## Ratio labels are declared, not computed

`816 x 1110` gcd-reduces to `136:185`. Useless in a Gemini prompt. Each target therefore carries
its own label string — `"11:15"`, `"29:36"` — and that label is what reaches the prompt and the
UI read-out. Never reduce pixel dimensions for display.

## The two routes

```mermaid
flowchart LR
  L["Landing hero<br/>3rd link"] --> PA["/padder<br/>upload, toggle, download"]
  PA -->|"sessionStorage target"| PO["/padder-outpaint<br/>static prompt instructions"]
```

Both sit outside the `(steps)` route group and share one small header component; the 3-step
Prep/Outpaint/Merge header does not apply. `/padder-outpaint` ships with **placeholder** prompt
text carrying a TODO — the size and ratio substitution is real, the prose is not final.

## Ways this goes wrong

- Reaching for `/prep`'s hook or canvas component "to save work" — it drags in scale state the
  feature is defined by not having.
- Centering the image vertically inside the cropped 29:36 canvas. The image keeps the position it
  had in the full tier; only the canvas shrinks.
- Downloading the preview canvas instead of a full-resolution render.
- Scaling an oversized image down to fit the largest tier instead of erroring.
