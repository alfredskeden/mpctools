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
