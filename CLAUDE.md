# Project: mpcproxy-art-nextjs-frontend

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- shadcn/ui components
- pnpm package manager

## Testing

- **Framework**: Vitest 4
- **Run tests**: `pnpm test`
- **Run tests with coverage**: `pnpm test:coverage`
- **Run specific test**: `pnpm test -- path/to/file.test.ts`
- **NEVER run the project** (`pnpm dev`, `pnpm build`, `pnpm start`) — only run tests via `pnpm test`
- **100% code coverage is enforced** — all statements, branches, functions, and lines must be covered
- Coverage thresholds are configured in `vitest.config.ts` and will fail the test run if not met
- Every piece of code must have corresponding tests — no exceptions
- Test files live alongside source files using the `.test.ts` / `.test.tsx` naming convention

## Project Structure

```
app/
  (steps)/              # Route group for step-based workflow
    layout.tsx          # Shared layout for all steps
    prep/               # Step 1: Image preparation
    outpaint/           # Step 2: Outpainting
    merger/             # Step 3: Merging
  layout.tsx            # Root layout
  page.tsx              # Landing page
  globals.css           # Global styles & Tailwind design tokens
components/
  ui/                   # shadcn/ui primitives (Button, Card, Badge, Separator)
  prep/                 # Prep step components
  outpaint/             # Outpaint step components
  header.tsx            # App header
  hero-section.tsx      # Landing hero
  ghost-card.tsx        # Ghost card component
  step-indicator.tsx    # Step progress indicator
hooks/                  # Custom React hooks (use-prep-workflow, use-outpaint-workflow, use-clipboard)
lib/                    # Utilities (canvas-utils, utils)
__mocks__/              # Test mocks
```

## Naming Conventions

- **React component files**: Use `PascalCase` (e.g., `KonvaCanvas.tsx`, `MyComponent.tsx`)
- **Non-component files**: Use `kebab-case` (e.g., `canvas-utils.ts`, `use-prep-workflow.ts`)
- **Test files**: Same name as source file with `.test.ts` / `.test.tsx` suffix

## Tailwind CSS Rules

- **No arbitrary values in classNames** — never use brackets like `w-[350px]`, `text-[#ff0000]`, `p-[13px]`, etc.
- All values must come from the design system (defined in `globals.css` or Tailwind's default theme)
- If a value doesn't exist in the design system, add it as a custom token in `globals.css` first, then reference it
- An ESLint plugin (`eslint-plugin-no-arbitrary-tailwind.mjs`) enforces this rule

## Path Aliases

- `@/*` maps to the project root

## Design Context

### Users
Anyone who wants to outpaint images using Gemini AI. Users arrive with an image and follow a 3-step workflow (Prep → Outpaint → Merge) to produce print-ready card art. They expect a focused, efficient tool that stays out of their way.

### Brand Personality
**Precise, Dark, Technical.** A tool-first aesthetic — efficient, no-nonsense, and developer-tool inspired. The interface should feel like a professional instrument, not a consumer app.

### Aesthetic Direction
- **Theme**: Dark mode default. Achromatic base palette with a single blue accent (oklch hue 253)
- **Typography**: Inter for UI, JetBrains Mono for code/data. Strong weight contrast between headings and body. Tight tracking on display type, wide tracking on labels
- **Surfaces**: Layered dark scale (ground → base → raised → overlay) with subtle borders at 10% white opacity
- **Color**: Restrained — one blue accent moment (`#4488FF`), green for success states only. No gradients, no decorative color
- **Spacing**: Defined custom scale with deliberate rhythm. Generous whitespace around hero content, tighter grouping for controls
- **Anti-references**: Not a generic SaaS dashboard. Not fantasy/gaming themed. Not playful or casual. No gradient CTAs, stock illustrations, heavy ornaments, or bright rounded aesthetics

### Design Principles
1. **Tool, not toy** — Every element serves the workflow. If it doesn't help the user prep, outpaint, or merge, it doesn't belong
2. **Quiet confidence** — Let the card art be the visual hero. The UI recedes through neutral surfaces and restrained color
3. **One accent, maximum impact** — Blue is the only chromatic color in the UI. Use it sparingly for active states, current steps, and primary actions
4. **Dark and layered** — Build depth through the surface scale, not shadows or gradients. Borders at low opacity create subtle separation
5. **Accessible by default** — WCAG AA contrast, keyboard navigation, screen reader support. Good contrast on all text, especially small labels
