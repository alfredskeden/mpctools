# MPC Tools — AI Image Outpainting

A browser-based tool for preparing, outpainting, and merging card art using AI. Built as a 3-step workflow: **Prep → Outpaint → Merge**.

- Crop, align, and DPI-normalize source scans
- Generate outpainted extensions via an AI handshake
- Blend the outpainted result back onto the original with control over seams, blending, and reseeding
- Optional watermark removal pipeline (client-side or server API)

## Stack

- Next.js 16 (App Router, React 19, standalone output)
- TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui (radix-nova style)
- Vitest 4 (100% coverage enforced)
- `sharp` + Web Workers for image processing
- `ag-psd` for PSD export
- pnpm

## Getting started

### Prerequisites

- Node 22 (`.nvmrc`)
- pnpm

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3050
NEXT_PUBLIC_UMAMI_WEBSITE_ID=       # optional, enables Umami analytics
WATERMARK_API_SECRET=               # required only if using /api/watermark-remove
```

### Run

```bash
pnpm dev           # http://localhost:3050
pnpm build
pnpm start
```

### Test

```bash
pnpm test             # full suite
pnpm test:watch
pnpm test:coverage    # enforces 100% coverage
pnpm lint             # ESLint
pnpm lint:ts          # tsc --noEmit
```

## Project layout

```
app/
  (steps)/              # 3-step workflow (prep, outpaint, merger)
  api/watermark-remove/ # Server-side watermark pipeline (Bearer auth)
  borderless-svg/       # Borderless card SVG tool
  design/               # Design prompt handshake
  page.tsx              # Landing page
components/
  ui/                   # shadcn primitives
  prep/ outpaint/ merger/   # Step-specific components
  landing/              # Landing page sections
hooks/                  # Custom React hooks (kebab-case)
lib/                    # Canvas utils, workers, watermark pipeline, PSD export
green-light/            # E2E scenarios (GreenLight)
public/                 # Static assets
```

## API: `POST /api/watermark-remove`

Server-side watermark removal. Requires `Authorization: Bearer $WATERMARK_API_SECRET`.

`multipart/form-data`:

| Field | Type | Default |
|-------|------|---------|
| `image` | file (required) | — |
| `adaptive` | bool | `false` |
| `corner` | `auto` \| top-left/top-right/bottom-left/bottom-right | auto |
| `forcedVariant` | string | — |
| `feather`, `postLightness`, `maskExpand`, `alphaGain`, `edgeReveal`, `innerPunch` | float | pipeline defaults |

Responds `image/png` with `x-detection-*` metadata headers. `403` if secret missing/wrong.

## Docker

```bash
docker compose up --build   # exposes :3050
```

## Development conventions

See [CLAUDE.md](./CLAUDE.md) for full conventions (file naming, testing rules, Tailwind restrictions, component patterns).

Highlights:

- **PascalCase** for composable UI components; **kebab-case** for everything else
- **No arbitrary Tailwind values** (`w-[350px]` etc.) — enforced by ESLint plugin
- **Behavior-first tests** — no assertions on copy or CSS class names
- **100% coverage** — enforced in `vitest.config.ts`
- **Path alias**: `@/*` → project root; no relative imports

## License

MIT — see [LICENSE](./LICENSE). Fork, modify, and use freely. Attribution (copyright notice) must be preserved. "MPC Tools" name and branding are not covered by this license.
