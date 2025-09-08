import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { Demo } from "@/models/Demo";
import type { DemoDTO } from "@/domain/demo";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  await connectToDB();
  const doc = await Demo.findOne({ slug }).lean<DemoDTO | null>();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(doc);
}
