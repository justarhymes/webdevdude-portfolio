import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { parseQuery } from "@/lib/parse";
import { zInt, zPosInt, zLimit } from "@/lib/zodHelpers";
import {
  resolveManyRelations,
  resolveOneRelation,
  type RelInput,
} from "@/repositories/relationResolvers";
import type { ProjectDTO } from "@/domain/project";

const QuerySchema = z.object({
  limit: zLimit(100, 24),
  page: zPosInt.default(1),
  featured: zInt.optional(), // 1 = true
  published: zInt.optional(), // 1 = true
  skill: z.string().optional(), // filter by skills.slug
  type: z.string().optional(), // filter by type.slug
  q: z.string().optional(), // title/summary/description contains
});

type ProjectFilter = Partial<{
  featured: boolean;
  published: boolean;
  "skills.slug": string;
  "type.slug": string;
  $or: Array<Record<string, { $regex: string; $options: "i" }>>;
}>;

// ⬇️ DB/lean shape where relations may be partial/unresolved
type RawRel = { slug?: string; name?: string } | null | undefined;
type RawProject = Omit<
  ProjectDTO,
  "skills" | "tasks" | "type" | "client" | "studio"
> & {
  skills?: RawRel[] | null;
  tasks?: RawRel[] | null;
  type?: RawRel;
  client?: RawRel;
  studio?: RawRel;
};

export async function GET(req: Request) {
  const parsed = parseQuery(QuerySchema, req.url);
  if (!parsed.ok)
    return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { limit, page, featured, published, skill, type, q } = parsed.data;

  await connectToDB();

  const filter: ProjectFilter = {};
  if (featured === 1) filter.featured = true;
  if (published === 1) filter.published = true;
  if (skill) filter["skills.slug"] = skill;
  if (type) filter["type.slug"] = type;
  if (q) {
    const regex = { $regex: q, $options: "i" as const };
    filter.$or = [{ title: regex }, { summary: regex }, { description: regex }];
  }

  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<RawProject[]>(), // ⬅️ use RawProject
    Project.countDocuments(filter),
  ]);

  const items = await Promise.all(
    rawItems.map(async (doc) => {
      const [skills, tasks, typeRel, clientRel, studioRel] = await Promise.all([
        resolveManyRelations(
          doc.skills as Array<RelInput | null | undefined> | undefined,
          "skill"
        ),
        resolveManyRelations(
          doc.tasks as Array<RelInput | null | undefined> | undefined,
          "task"
        ),
        resolveOneRelation(doc.type as RelInput | undefined, "type"),
        resolveOneRelation(doc.client as RelInput | undefined, "client"),
        resolveOneRelation(doc.studio as RelInput | undefined, "studio"),
      ]);

      return {
        ...doc,
        skills,
        tasks,
        type: typeRel ?? null,
        client: clientRel ?? null,
        studio: studioRel ?? null,
      };
    })
  );

  return NextResponse.json({
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    items,
  });
}
