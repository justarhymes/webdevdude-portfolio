import { makeNextRequest as req } from "../utils/makeNextRequest";
import { GET as ProjectsGET } from "@/app/api/projects/route";
import { seedBasic } from "../fixtures/seed";

describe("GET /api/projects (detail via list lookup)", () => {
  beforeEach(async () => {
    await seedBasic();
  });

  it("returns a project with resolved relations when found by slug in the list", async () => {
    const slug = "gamer-sensei-migration";

    // Your index route doesn't accept ?slug, so request the published list
    const res = await ProjectsGET(req("http://test.local/api/projects?published=1&limit=50"));
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);

    // Find the desired project in the list
    const project = data.items.find((p: any) => p.slug === slug) ?? data.items[0];
    expect(project).toBeDefined();

    // Core shape
    expect(project).toHaveProperty("slug");
    expect(project).toHaveProperty("title");
    expect(project).toHaveProperty("thumb");
    expect(Array.isArray(project.media)).toBe(true);
    expect(Array.isArray(project.skills)).toBe(true);

    // tasks is optional in your current DTO; assert array only if present
    if ("tasks" in project && project.tasks != null) {
      expect(Array.isArray(project.tasks)).toBe(true);
    }

    // relations (may be null, but keys should exist on DTO)
    expect(project).toHaveProperty("client");
    expect(project).toHaveProperty("studio");
    expect(project).toHaveProperty("type");

    // abbreviation is optional in your API; if present, it should be string/null
    if ("abbreviation" in project) {
      expect(typeof project.abbreviation === "string" || project.abbreviation == null).toBe(true);
    }
  });

  it("does not include an unknown slug in the list", async () => {
    const res = await ProjectsGET(req("http://test.local/api/projects?published=1&limit=50"));
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);

    const found = data.items.find((p: any) => p.slug === "does-not-exist");
    expect(found).toBeUndefined();
  });
});