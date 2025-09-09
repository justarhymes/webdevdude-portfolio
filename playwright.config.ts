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
    // Force IPv4 to avoid ::1 in CI
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001",
  },
  webServer: {
    // Bind Next explicitly to IPv4 + chosen port
    command: "sh -c 'npm run build && next start -p 3001 -H 127.0.0.1'",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // If your API reads these at boot, pass them here or set them in the GH workflow env
    // env: { MONGODB_URI: "mongodb://127.0.0.1:27017", MONGO_DB: "ci_e2e", ADMIN_TOKEN: "ci-token" }
  },
  reporter: "list",
});
