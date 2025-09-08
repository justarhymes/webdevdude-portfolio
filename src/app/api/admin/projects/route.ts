// admin/projects
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { Project } from "@/models/Project";
import { resolveManyRelations, resolveOneRelation } from "@/repositories/relationResolvers";

const Rel = z.object({
  slug: z.string().optional(),
  name: z.string().optional(),
  _new: z.boolean().optional(),
}).refine(v => v.slug || v.name, { message: "slug or name required" });

const Body = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  primaryLink: z.string().url().optional(),
  secondaryLink: z.string().url().optional(),
  thumb: z.string().optional(),
  media: z.array(z.string()).default([]),
  skills: z.array(Rel).default([]),
  type: Rel.optional(),
  client: Rel.optional(),
  studio: Rel.optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().int().optional(),
});

function qpBool(url: URL, key: string) {
  const v = url.searchParams.get(key);
  return v === "1" || v?.toLowerCase() === "true";
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await connectToDB();

  const url = new URL(req.url);
  const allowNew = qpBool(url, "allowNew");
  const dryRun = qpBool(url, "dryRun");

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Invalid body" } }, { status: 400 });
  }

  const p = parsed.data;
  const [skills, type, client, studio] = await Promise.all([
    resolveManyRelations(p.skills, "skill", { allowNew, backfillSlug: true }),
    resolveOneRelation(p.type, "type", { allowNew, backfillSlug: true }),
    resolveOneRelation(p.client, "client", { allowNew, backfillSlug: true }),
    resolveOneRelation(p.studio, "studio", { allowNew, backfillSlug: true }),
  ]);

  const $set = { ...p, skills, type, client, studio };
  if (dryRun) return NextResponse.json({ dryRun: true, set: $set });

  const doc = await Project.findOneAndUpdate(
    { slug: p.slug },
    { $set },
    { upsert: true, new: true }
  ).lean();
  return NextResponse.json(doc);
}
