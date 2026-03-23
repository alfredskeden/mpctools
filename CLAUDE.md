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
    prep/               # Step 1: Image preparation (page.tsx + page.test.tsx)
    outpaint/           # Step 2: Outpainting (page.tsx + page.test.tsx)
    merger/             # Step 3: Merging (page.tsx + page.test.tsx)
  layout.tsx            # Root layout (Server Component, loads fonts/metadata)
  page.tsx              # Landing page
  globals.css           # Global styles & Tailwind design tokens
components/
  ui/                   # shadcn/ui primitives (Button, Card, Badge, Separator, StepCircle)
    __tests__/          # Tests for ui components
  prep/                 # Prep step components
    toolbar/            # Toolbar sub-components and panels
      panels/           # Individual panel components (CanvasSizePanel, DpiOverridePanel, etc.)
      __tests__/
    __tests__/
  outpaint/             # Outpaint step components
    __tests__/
  merger/               # Merger step components
    __tests__/
  __tests__/            # Tests for root-level components
hooks/                  # Custom React hooks (always kebab-case)
  __tests__/            # Hook tests
lib/                    # Utilities, canvas logic, worker client, type definitions
  image.worker.ts       # Web Worker for image processing
  worker-client.ts      # Manages worker communication
  step-types.ts         # Shared type definitions
__mocks__/              # Global test mocks
```

## Naming Conventions

### File Naming
- **Composable UI components** (reusable, standalone): `PascalCase` (e.g., `Header.tsx`, `TransformCanvas.tsx`, `PrepToolbar.tsx`)
- **Container/composite components** (page-level orchestrators): `kebab-case` (e.g., `prep-page-content.tsx`, `image-drop-zone.tsx`)
- **Hooks**: Always `kebab-case` (e.g., `use-prep-workflow.ts`, `use-click-outside.ts`)
- **Utilities and lib files**: Always `kebab-case` (e.g., `canvas-utils.ts`, `step-types.ts`)
- **Test files**: Same name as source with `.test.ts` / `.test.tsx` suffix

**Rule of thumb**: If the file exports a single composable UI component meant to be dropped into layouts, use PascalCase. Everything else (containers, orchestrators, hooks, utils) is kebab-case.

### Exports
- **Named exports** for all components and hooks — no default exports except Next.js page files
- Page files (`page.tsx`) must use `export default function`

### Test File Placement
- **Components and hooks**: Place tests in a `__tests__/` subdirectory alongside the source
  - `components/prep/TransformCanvas.tsx` → `components/prep/__tests__/TransformCanvas.test.tsx`
  - `hooks/use-click-outside.ts` → `hooks/__tests__/use-click-outside.test.ts`
- **Library/utility files**: Tests live inline next to the source file
  - `lib/canvas-utils.ts` → `lib/canvas-utils.test.ts`
- **Pages**: Tests live inline next to the page
  - `app/(steps)/prep/page.tsx` → `app/(steps)/prep/page.test.tsx`

## Tailwind CSS Rules

- **No arbitrary values in classNames** — never use brackets like `w-[350px]`, `text-[#ff0000]`, `p-[13px]`, etc.
- All values must come from the design system (defined in `globals.css` or Tailwind's default theme)
- If a value doesn't exist in the design system, add it as a custom token in `globals.css` first, then reference it
- An ESLint plugin (`eslint-plugin-no-arbitrary-tailwind.mjs`) enforces this rule

## Path Aliases

- `@/*` maps to the project root
- Always import with `@/` prefix — never use relative paths (e.g., `@/components/Header`, not `../../components/Header`)
- Import ordering: React/Next → third-party libraries → project imports (`@/`) → type imports (`import type`)

## Component Patterns

### New Component Checklist
1. Determine if PascalCase (composable UI) or kebab-case (container/orchestrator)
2. Place in the appropriate feature folder (`components/prep/`, `components/outpaint/`, etc.) or `components/` root for shared components
3. Use named export (not default)
4. Add `"use client"` if the component uses hooks, event handlers, or browser APIs
5. Create a matching test file in the `__tests__/` subdirectory

### Component Structure
```typescript
"use client"; // only if needed

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SomeType } from "@/lib/step-types";

type MyComponentProps = {
  required: string;
  optional?: number;
  className?: string;
};

export function MyComponent({ required, optional = 0, className }: MyComponentProps) {
  return <div className={cn("base-classes", className)}>{required}</div>;
}
```

### shadcn/ui Components
- Import from `@/components/ui/` (not from node_modules directly)
- UI components use CVA (class-variance-authority) for variants and `cn()` for className merging
- Accept `className` prop for extension
- Export multiple sub-components from one file (e.g., `Card`, `CardHeader`, `CardContent`)
- Use the `Slot` pattern (`asChild`) for polymorphic components

## Hook Patterns

All hooks live in `/hooks/` with kebab-case names and always include `"use client"`.

Use `useReducer` for complex multi-action workflows, `useState` for simple toggle/value state. No external state library (no Zustand, Redux, etc.).

```typescript
"use client";

import { useReducer, useCallback } from "react";

type MyState = { /* ... */ };
type MyAction = { type: "ACTION_NAME"; payload: unknown };

function reducer(state: MyState, action: MyAction): MyState {
  switch (action.type) {
    case "ACTION_NAME": return { ...state };
    default: return state;
  }
}

export function useMyWorkflow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const doSomething = useCallback((value: unknown) => {
    dispatch({ type: "ACTION_NAME", payload: value });
  }, []);

  return { state, doSomething };
}
```

## Testing Patterns

### Libraries
- `vitest` — test runner
- `@testing-library/react` — component testing (`render`, `screen`)
- `renderHook` from `@testing-library/react` — hook testing
- `vitest-canvas-mock` — canvas API mocking
- `jsdom` — DOM environment

### Test Structure (Given/When/Then)
```typescript
describe("ComponentName", () => {
  it("describes the behavior in business terms", () => {
    // Given
    const props = { required: "value" };

    // When
    render(<ComponentName {...props} />);

    // Then
    expect(screen.getByText("value")).toBeDefined();
  });
});
```

### Mocking
- Mock all external dependencies (canvas, FileReader, Image, workers)
- Use `vi.fn()` for function mocks, `vi.stubGlobal()` for globals
- Use `/* v8 ignore start */` / `/* v8 ignore stop */` to exclude browser-only code from coverage

### Coverage
- 100% enforced on all statements, branches, functions, and lines
- Layout files are excluded from coverage thresholds
- Run `pnpm test:coverage` to verify before committing

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
