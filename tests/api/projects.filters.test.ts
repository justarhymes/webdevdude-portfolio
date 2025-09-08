import { makeNextRequest as req } from "../utils/makeNextRequest";
import { GET as ProjectsGET } from "@/app/api/projects/route";
import { seedBasic } from "../fixtures/seed";

describe("GET /api/projects (filters)", () => {
  beforeEach(async () => {
    await seedBasic();
  });

  it("filters by type slug", async () => {
    const res = await ProjectsGET(req("http://test.local/api/projects?type=web-app&published=1"));
    const data = await res.json();

    expect(Array.isArray(data.items)).toBe(true);
    for (const p of data.items) {
      expect(p.type?.slug).toBe("web-app");
    }
  });

  it("filters by skill slug", async () => {
    const res = await ProjectsGET(req("http://test.local/api/projects?skill=react&published=1"));
    const data = await res.json();

    expect(Array.isArray(data.items)).toBe(true);
    for (const p of data.items) {
      const slugs = (p.skills || []).map((s: any) => s.slug);
      expect(slugs).toContain("react");
    }
  });
});