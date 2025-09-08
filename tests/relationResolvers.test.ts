// uses the global Mongo setup from tests/setup/mongo.ts
import { describe, it, expect } from "vitest";
import { Skill } from "@/models/Skill";
import { Type } from "@/models/Type";
import { Client } from "@/models/Client";
import { Studio } from "@/models/Studio";
import {
  resolveOneRelation,
  resolveManyRelations,
} from "@/repositories/relationResolvers";

describe("relationResolvers", () => {
  it("resolves existing single relation", async () => {
    await Type.create({ slug: "web-app", name: "Web App" });

    const got = await resolveOneRelation({ slug: "web-app" }, "type");
    expect(got).toEqual({ slug: "web-app", name: "Web App" });
  });

  it("returns null for missing when allowNew=false", async () => {
    const got = await resolveOneRelation({ slug: "nope" }, "type", {
      allowNew: false,
    });
    expect(got).toBeNull();
  });

  it("creates new when allowNew=true and _new=true", async () => {
    const got = await resolveOneRelation(
      { slug: "brand", name: "Brand", _new: true },
      "client",
      { allowNew: true }
    );
    expect(got).toEqual({ slug: "brand", name: "Brand" });

    const exists = await Client.findOne({ slug: "brand" }).lean<{
      slug: string;
    } | null>();
    expect(exists?.slug).toBe("brand");
  });

  it("resolves many skills, keeping only matches", async () => {
    await Skill.create([
      { slug: "react", name: "React" },
      { slug: "ts", name: "TypeScript" },
    ]);

    const result = await resolveManyRelations(
      [{ slug: "react" }, { slug: "nope" }],
      "skill"
    );
    expect(result).toEqual([{ slug: "react", name: "React" }]);
  });

  it("resolves many and creates new where allowed", async () => {
    const result = await resolveManyRelations(
      [{ slug: "studiox", name: "Studio X", _new: true }],
      "studio",
      { allowNew: true }
    );
    expect(result).toEqual([{ slug: "studiox", name: "Studio X" }]);

    const exists = await Studio.findOne({ slug: "studiox" }).lean<{
      slug: string;
    } | null>();
    expect(exists?.slug).toBe("studiox");
  });
});