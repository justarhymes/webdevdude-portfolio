import { test, expect } from "@playwright/test";

test("GET /api/skills returns array", async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/skills?limit=1&page=1`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.items)).toBe(true);
});
