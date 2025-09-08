import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import fs from "node:fs";

// Load env for tests (so process.env.ADMIN_TOKEN is set here)
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
else dotenv.config();

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["**/*.spec.ts"], // only pick e2e specs, not vitest tests
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",
  },
  webServer: {
    command: "sh -c 'npm run build && PORT=3001 npm run start'",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  reporter: "list",
});
