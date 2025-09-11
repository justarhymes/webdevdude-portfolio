// tests/e2e/api.projects.filters.spec.ts
import { test, expect } from "@playwright/test";

const ADMIN = process.env.ADMIN_TOKEN;
test.skip(!ADMIN, "ADMIN_TOKEN not set");

test("filter by published, featured, q and paginate", async ({ request }) => {
  for (let i = 0; i < 3; i++) {
    const slug = `pf-${Date.now()}-${i}`;
    await request.post(`/api/admin/projects?allowNew=1`, {
      headers: { "x-admin-token": ADMIN!, "content-type": "application/json" },
      data: {
        title: `Proj ${i}`,
        slug,
        published: i % 2 === 0,
        featured: i === 2,
        media: [],
        skills: i === 1 ? [{ slug: "react", _new: true, name: "React" }] : [],
      },
    });
  }

  {
    const r = await request.get(`/api/projects?published=1`);
    const j = await r.json();
    expect(j.items.length).toBeGreaterThan(0);
    expect(j.items.every((p: any) => p.published === true)).toBe(true);
  }

  {
    const r = await request.get(`/api/projects?featured=1`);
    const j = await r.json();
    expect(j.items.length).toBe(1);
    expect(j.items[0].featured).toBe(true);
  }

  {
    const r = await request.get(`/api/projects?q=Proj`);
    const j = await r.json();
    expect(j.items.length).toBeGreaterThan(0);
  }

  {
    const r1 = await request.get(`/api/projects?limit=1&page=1`);
    const r2 = await request.get(`/api/projects?limit=1&page=2`);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.items.length).toBe(1);
    expect(j2.items.length).toBe(1);
    expect(j1.items[0].slug).not.toBe(j2.items[0].slug);
  }
});
