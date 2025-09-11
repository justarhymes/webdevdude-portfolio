// tests/e2e/api.projects.public.spec.ts
import { test, expect } from "@playwright/test";

test("GET /api/projects?published=1 returns array", async ({ request }) => {
  const res = await request.get(`/api/projects?published=1`);
  expect(res.ok()).toBeTruthy();

  const json = await res.json();
  expect(json).toHaveProperty("items");
  expect(Array.isArray(json.items)).toBe(true);
});
