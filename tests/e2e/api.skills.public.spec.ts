// tests/e2e/api.skills.public.spec.ts
import { test, expect } from "@playwright/test";

test("GET /api/skills returns array", async ({ request }) => {
  const res = await request.get(`/api/skills?limit=1&page=1`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.items)).toBe(true);
});
