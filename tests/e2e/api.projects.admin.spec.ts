// tests/e2e/api.projects.admin.spec.ts
import { test, expect } from "@playwright/test";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
test.skip(!ADMIN_TOKEN, "ADMIN_TOKEN not set; skipping admin E2E");

test("admin can create, read, and delete a project", async ({ request }) => {
  const slug = `e2e-${Date.now()}`;

  const createRes = await request.post(`/api/admin/projects?allowNew=1`, {
    headers: {
      "x-admin-token": ADMIN_TOKEN!,
      "content-type": "application/json",
    },
    data: {
      title: "E2E Project",
      slug,
      published: true,
      featured: false,
      media: [],
      skills: [],
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const created = await createRes.json();
  expect(created.slug).toBe(slug);

  const getRes = await request.get(`/api/projects/${slug}`);
  expect(getRes.ok()).toBeTruthy();
  const got = await getRes.json();
  expect(got.slug).toBe(slug);
  expect(got.published).toBe(true);

  const delRes = await request.delete(`/api/admin/projects/${slug}`, {
    headers: { "x-admin-token": ADMIN_TOKEN! },
  });
  expect(delRes.ok()).toBeTruthy();
  const delJson = await delRes.json();
  expect(delJson.ok).toBe(true);
});
