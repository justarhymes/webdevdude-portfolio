// tests/e2e/api.projects.negatives.spec.ts
import { test, expect } from "@playwright/test";

test("unauthorized admin calls return 401", async ({ request }) => {
  const res = await request.post(`/api/admin/projects`, {
    data: { title: "X", slug: `x-${Date.now()}`, media: [], skills: [] },
  });
  expect(res.status()).toBe(401);
});

test("dryRun create returns a plan and writes nothing", async ({ request }) => {
  const slug = `dry-${Date.now()}`;
  const res = await request.post(`/api/admin/projects?dryRun=1&allowNew=1`, {
    headers: {
      "x-admin-token": process.env.ADMIN_TOKEN!,
      "content-type": "application/json",
    },
    data: { title: "Dry", slug, media: [], skills: [] },
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.dryRun).toBe(true);

  const check = await request.get(`/api/projects/${slug}`);
  expect(check.status()).toBe(404);
});
