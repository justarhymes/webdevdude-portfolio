import { makeNextRequest as req } from "../utils/makeNextRequest";
import { GET as ProjectsGET } from "@/app/api/projects/route";
import { seedBasic } from "../fixtures/seed";

describe("GET /api/projects (index)", () => {
  beforeEach(async () => {
    await seedBasic();
  });

  it("returns published projects when ?published=1", async () => {
    const res = await ProjectsGET(req("http://test.local/api/projects?published=1"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    // seed has "gamer-sensei-migration" first by order
    expect(data.items[0].slug).toBe("gamer-sensei-migration");
  });

  it("paginates results", async () => {
    const res = await ProjectsGET(req("http://test.local/api/projects?page=2&limit=1&published=1"));
    const data = await res.json();

    expect(data.page).toBe(2);
    expect(data.limit).toBe(1);
    expect(data.total).toBeGreaterThanOrEqual(2);
    expect(data.items).toHaveLength(1);
  });
});