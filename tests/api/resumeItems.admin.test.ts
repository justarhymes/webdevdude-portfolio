import { vi, describe, it, expect } from "vitest";
import { makeNextRequest as req } from "../utils/makeNextRequest";

// Mock the admin guard to allow POSTs
vi.mock("@/lib/requireAdmin", () => ({
  // your route expects undefined when authorized
  requireAdmin: vi.fn(() => undefined),
}));

import { POST as AdminResumePOST } from "@/app/api/admin/resume-items/route";
import { GET as PublicResumeGET } from "@/app/api/resume-items/route";

describe("ADMIN /api/admin/resume-items + PUBLIC /api/resume", () => {
  it("creates a resume item via admin POST and lists it via public GET", async () => {
    const payload = {
      section: "experience",
      title: "Senior Frontend Engineer",
      company: "Corsair",
      startDate: "2022-01-01",
      endDate: null,
      highlights: ["Led React migration", "Improved performance"],
      order: 1,
      location: "Remote",
      skills: [{ slug: "react" }],
    };

    const postRes = await AdminResumePOST(
      req("http://test.local/api/admin/resume-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    expect(created.title).toBe(payload.title);
    expect(created.section).toBe("experience");

    const getRes = await PublicResumeGET(
      req("http://test.local/api/resume-items")
    );
    expect(getRes.ok).toBe(true);
    const data = await getRes.json();

    const items = Array.isArray(data) ? data : data.items;
    expect(Array.isArray(items)).toBe(true);
    expect(items.some((r: any) => r.title === payload.title)).toBe(true);
  });
});
