// admin/projects/[slug]
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { Project } from "@/models/Project";
import {
  resolveManyRelations,
  resolveOneRelation,
} from "@/repositories/relationResolvers";

const Rel = z
  .object({
    slug: z.string().optional(),
    name: z.string().optional(),
    _new: z.boolean().optional(),
  })
  .refine((v) => v.slug || v.name, { message: "slug or name required" });

const Patch = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  primaryLink: z.string().url().optional(),
  secondaryLink: z.string().url().optional(),
  thumb: z.string().optional(),
  media: z.array(z.string()).optional(),
  skills: z.array(Rel).optional(),
  type: Rel.optional(),
  client: Rel.optional(),
  studio: Rel.optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});

function qpBool(url: URL, key: string) {
  const v = url.searchParams.get(key);
  return v === "1" || v?.toLowerCase() === "true";
}

// NOTE: Next 15 — context.params is a Promise
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await connectToDB();

  const { slug } = await ctx.params;

  const url = new URL(req.url);
  const allowNew = qpBool(url, "allowNew");
  const dryRun = qpBool(url, "dryRun");

  const json = await req.json();
  const parsed = Patch.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Invalid body" } },
      { status: 400 }
    );
  }

  const p = parsed.data;
  const $set: Record<string, unknown> = { ...p };

  if (p.skills) {
    $set.skills = await resolveManyRelations(p.skills, "skill", {
      allowNew,
      backfillSlug: true,
    });
  }
  if (p.type) {
    $set.type = await resolveOneRelation(p.type, "type", {
      allowNew,
      backfillSlug: true,
    });
  }
  if (p.client) {
    $set.client = await resolveOneRelation(p.client, "client", {
      allowNew,
      backfillSlug: true,
    });
  }
  if (p.studio) {
    $set.studio = await resolveOneRelation(p.studio, "studio", {
      allowNew,
      backfillSlug: true,
    });
  }

  if (dryRun) return NextResponse.json({ dryRun: true, set: $set });

  const doc = await Project.findOneAndUpdate(
    { slug },
    { $set },
    { new: true }
  ).lean();
  if (!doc)
    return NextResponse.json(
      { error: { message: "Not found" } },
      { status: 404 }
    );
  return NextResponse.json(doc);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await connectToDB();

  const { slug } = await ctx.params;

  const res = await Project.deleteOne({ slug });
  return NextResponse.json({ ok: res.deletedCount === 1 });
}
