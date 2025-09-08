// projects/[slug]
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { Project } from "@/models/Project";
import {
  resolveManyRelations,
  resolveOneRelation,
} from "@/repositories/relationResolvers";
import type { ProjectDTO } from "@/domain/project";

// helpers to safely narrow unknown -> {slug?, name?}
type SlugName = { slug?: string; name?: string };
function isSlugName(x: unknown): x is SlugName {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return typeof r.slug === "string" || typeof r.name === "string";
}
function relArray(v: unknown): SlugName[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter(isSlugName);
}
function relOne(v: unknown): SlugName | null {
  return isSlugName(v) ? v : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> } // Next 15: params is a Promise
) {
  const { slug } = await ctx.params;

  await connectToDB();

  const doc = await Project.findOne({ slug }).lean<ProjectDTO | null>();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access potentially loose fields via a safe record, then narrow
  const rec = doc as unknown as Record<string, unknown>;
  const skillsIn = relArray(rec["skills"]);
  const typeIn = relOne(rec["type"]);
  const clientIn = relOne(rec["client"]);
  const studioIn = relOne(rec["studio"]);

  const [skills, typeRel, clientRel, studioRel] = await Promise.all([
    resolveManyRelations(skillsIn, "skill"),
    resolveOneRelation(typeIn, "type"),
    resolveOneRelation(clientIn, "client"),
    resolveOneRelation(studioIn, "studio"),
  ]);

  return NextResponse.json({
    ...doc,
    skills,
    type: typeRel ?? null,
    client: clientRel ?? null,
    studio: studioRel ?? null,
  });
}
