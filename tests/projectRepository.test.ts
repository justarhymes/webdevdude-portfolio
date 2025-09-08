// uses global Mongo setup from tests/setup/mongo.ts
import { describe, it, expect, beforeEach } from "vitest";
import { Project } from "@/models/Project";

describe("projectRepository", () => {
  beforeEach(async () => {
    // minimal seed ensuring schema requirements are satisfied
    await Project.deleteMany({});
  });

  // keep skipped (as before), but no local DB connections anymore
  it.skip("creates a project (upsert)", async () => {
    // Example shape; adjust to match your repository helper once enabled
    const doc = await Project.create({
      title: "Sample",
      slug: "sample",
      published: true,
      featured: false,
      order: 1,
      thumb: "sample/thumb.jpg",
      media: [],
      // embedded relation slugs (matches your schema)
      client: null,
      studio: { slug: "jellybox" },
      type: { slug: "web-app" },
      skills: [{ slug: "react" }],
      tasks: [{ slug: "frontend" }],
    });

    expect(doc.slug).toBe("sample");
  });
});