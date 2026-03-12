import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["app/**", "components/**", "hooks/**", "lib/**"],
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/layout.tsx",
        "node_modules/**",
        "**/*.ico",
        "**/*.css",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
