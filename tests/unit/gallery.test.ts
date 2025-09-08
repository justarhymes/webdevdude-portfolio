import { describe, it, expect } from "vitest";
import { pickInitialHero, buildThumbs } from "@/lib/gallery";
import type { Project } from "@/types/project";

const base: Project = {
  slug: "demo",
  title: "Demo",
  thumb: "https://cdn.example.com/p/demo/thumb.jpg",
  media: [
    { url: "https://cdn.example.com/p/demo/page001.jpg" },
    { url: "https://cdn.example.com/p/demo/page002.jpg" },
    { url: "https://cdn.example.com/p/demo/page003.jpg" },
  ],
};

describe("gallery utils (first-item rule)", () => {
  it("uses the first media item as hero", () => {
    expect(pickInitialHero(base)?.url).toBe("https://cdn.example.com/p/demo/page001.jpg");
  });

  it("thumbs exclude the hero by URL", () => {
    const hero = { url: "https://cdn.example.com/p/demo/page002.jpg" };
    const thumbs = buildThumbs(base.media!, hero);
    expect(thumbs.some((t) => t.url === hero.url)).toBe(false);
  });

  it("handles empty media safely", () => {
    const p: Project = { ...base, media: [] };
    expect(pickInitialHero(p)).toBeUndefined();
    expect(buildThumbs([], undefined)).toEqual([]);
  });
});
