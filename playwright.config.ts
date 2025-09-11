import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import fs from "node:fs";

if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
else dotenv.config();

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["**/*.spec.ts"],
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3001",
  },
  webServer: {
    command: "sh -c 'npm run build && next start -p 3001 -H 127.0.0.1'",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ADMIN_TOKEN: "ci-admin" },
  },
  reporter: "list",
});
