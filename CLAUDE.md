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

## Path Aliases

- `@/*` maps to the project root
