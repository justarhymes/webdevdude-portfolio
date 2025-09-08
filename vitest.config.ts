import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup/mongo.ts"], // in-memory Mongo setup/teardown
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      reporter: ["text", "html"],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
      include: ["src/app/api/**/*", "src/models/**/*", "src/lib/**/*"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});