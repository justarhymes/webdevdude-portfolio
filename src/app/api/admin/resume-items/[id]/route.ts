// admin/resume-items/[id]
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { ResumeItem } from "@/models/ResumeItem";
import { resolveManyRelations } from "@/repositories/relationResolvers";
import { ResumeItemInput } from "@/domain/resume";

const Patch = ResumeItemInput.partial();

function qpBool(url: URL, key: string) {
  const v = url.searchParams.get(key);
  return v === "1" || v?.toLowerCase() === "true";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await connectToDB();

  const url = new URL(req.url);
  const allowNew = qpBool(url, "allowNew");
  const dryRun = qpBool(url, "dryRun");

  const json = await req.json();
  const parsed = Patch.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Invalid body" } }, { status: 400 });
  }

  const p = parsed.data;
  const $set: Record<string, unknown> = { ...p };
  if (p.skills) $set.skills = await resolveManyRelations(p.skills, "skill", { allowNew, backfillSlug: true });

  if (dryRun) return NextResponse.json({ dryRun: true, set: $set });

  const doc = await ResumeItem.findByIdAndUpdate(params.id, { $set }, { new: true }).lean();
  if (!doc) return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await connectToDB();

  const res = await ResumeItem.deleteOne({ _id: params.id });
  return NextResponse.json({ ok: res.deletedCount === 1 });
}
