# Build stage
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild sharp esbuild unrs-resolver

COPY . .
RUN pnpm build

# Run stage
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
