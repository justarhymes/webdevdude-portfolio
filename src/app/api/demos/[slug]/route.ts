// api demo [slug] route
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { Demo } from "@/models/Demo";

type Ctx = { params: Promise<{ slug: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;

  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  await connectToDB();

  const res = await Demo.deleteOne({ slug });
  if (!res.deletedCount) {
    return NextResponse.json(
      { error: `Demo "${slug}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deletedCount: res.deletedCount ?? 0 });
}
