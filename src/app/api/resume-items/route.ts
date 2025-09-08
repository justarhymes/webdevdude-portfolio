import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDB } from "@/lib/db";
import { ResumeItem } from "@/models/ResumeItem";
import { parseQuery } from "@/lib/parse";
import { zInt, zLimit } from "@/lib/zodHelpers";
import { ResumeSection } from "@/domain/resume";
import type { ResumeItemDTO } from "@/domain/resume";

const QuerySchema = z.object({
  section: ResumeSection.optional(),        // filter one section
  hidden: zInt.optional(),                  // 1 = include hidden
  group: zInt.optional(),                   // 1 = group by section
  limit: zLimit(200, 200),
});

type ResumeFilter = {
  section?: z.infer<typeof ResumeSection>;
  hidden?: { $ne: true } | boolean;
};

export async function GET(req: Request) {
  const parsed = parseQuery(QuerySchema, req.url);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { section, hidden, group, limit } = parsed.data;

  await connectToDB();

  const filter: ResumeFilter = {};
  if (section) filter.section = section;
  if (hidden !== 1) filter.hidden = { $ne: true }; // default: exclude hidden

  const items = await ResumeItem.find(filter)
    .sort({ section: 1, order: 1, startDate: -1, createdAt: -1 })
    .limit(limit)
    .lean<ResumeItemDTO[]>();

  if (group === 1) {
    const grouped: Partial<Record<z.infer<typeof ResumeSection>, ResumeItemDTO[]>> = {};
    for (const it of items) {
      (grouped[it.section] ||= []).push(it);
    }
    return NextResponse.json(grouped);
  }

  return NextResponse.json(items);
}
