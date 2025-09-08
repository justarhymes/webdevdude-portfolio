import { makeNextRequest as req } from "../utils/makeNextRequest";
import { GET as SkillsGET } from "@/app/api/skills/route";
import { Skill } from "@/models/Skill";

describe("GET /api/skills", () => {
  beforeEach(async () => {
    await Skill.create([
      { name: "Next.js", slug: "nextjs" },
      { name: "React", slug: "react" },
      { name: "Tailwind", slug: "tailwind" },
    ]);
  });

  it("returns skills sorted by name asc (default)", async () => {
    const res = await SkillsGET(req("http://test.local/api/skills?page=1&limit=50"));
    expect(res.ok).toBe(true);
    const data = await res.json();

    const names = data.items.map((s: any) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("supports descending by name with ?sort=-name", async () => {
    const res = await SkillsGET(req("http://test.local/api/skills?sort=-name&page=1&limit=50"));
    expect(res.ok).toBe(true);
    const data = await res.json();

    const names = data.items.map((s: any) => s.name);
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });
});