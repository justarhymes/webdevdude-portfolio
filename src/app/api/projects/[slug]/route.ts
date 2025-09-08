// projects/[slug]
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { resolveManyRelations, resolveOneRelation } from "@/repositories/relationResolvers";
import type { ProjectDTO } from "@/domain/project";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> } // Next 15: params is a Promise
) {
  const { slug } = await ctx.params;

  await connectToDB();

  const doc = await Project.findOne({ slug }).lean<ProjectDTO | null>();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [skills, typeRel, clientRel, studioRel] = await Promise.all([
    resolveManyRelations((doc as any).skills, "skill"),
    resolveOneRelation((doc as any).type, "type"),
    resolveOneRelation((doc as any).client, "client"),
    resolveOneRelation((doc as any).studio, "studio"),
  ]);

  return NextResponse.json({
    ...doc,
    skills,
    type: typeRel ?? null,
    client: clientRel ?? null,
    studio: studioRel ?? null,
  });
}
