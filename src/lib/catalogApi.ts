import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Model, SortOrder } from "mongoose";
import { connectToDB } from "@/lib/db";

export const catalogQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["name", "-name"]).default("name"),
});

/**
 * Build a GET handler for simple catalog collections (skills/types/clients/studios).
 * Supports q (name/slug regex), pagination and name sorting.
 */
export function makeCatalogGetHandler(
  M: Model<Record<string, unknown>>
) {
  return async function GET(req: NextRequest) {
    await connectToDB();

    const url = new URL(req.url);
    const parsed = catalogQuerySchema.safeParse(
      Object.fromEntries(url.searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid query" } },
        { status: 400 }
      );
    }

    const { q, limit, page, sort } = parsed.data;

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }

    const sortObj: Record<string, SortOrder> =
      sort.startsWith("-") ? { [sort.slice(1)]: -1 } : { [sort]: 1 };

    const [items, total] = await Promise.all([
      M.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      M.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  };
}
