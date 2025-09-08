import mongoose from "mongoose";
import { Skill } from "@/models/Skill";
import { Task } from "@/models/Task";
import { Type } from "@/models/Type";
import { Client } from "@/models/Client";
import { Studio } from "@/models/Studio";
import { slugify } from "@/lib/slug";

type Kind = "skill" | "task" | "type" | "client" | "studio";
const modelMap = {
  skill: Skill,
  task: Task,
  type: Type,
  client: Client,
  studio: Studio,
} as const;

export type RelInput = {
  _id?: any;
  slug?: string;
  name?: string;
  _new?: boolean;
};
export type LeanRel = { slug: string; name?: string };
export type ResolveOpts = {
  session?: mongoose.ClientSession | null;
  allowNew?: boolean;
  backfillSlug?: boolean;
};

async function findByAny<T extends { _id?: any; slug?: string; name?: string }>(
  kind: Kind,
  inp: RelInput,
  session?: mongoose.ClientSession | null
): Promise<T | null> {
  const M = modelMap[kind];

  if (inp?._id) {
    const byId = await M.findById(inp._id)
      .session(session ?? null)
      .lean<T | null>();
    if (byId) return byId;
  }
  if (inp?.slug) {
    const bySlug = await M.findOne({ slug: inp.slug })
      .session(session ?? null)
      .lean<T | null>();
    if (bySlug) return bySlug;
  }
  if (inp?.name) {
    return await M.findOne({ name: inp.name })
      .session(session ?? null)
      .lean<T | null>();
  }
  return null;
}

export async function resolveOneRelation(
  input: RelInput | undefined | null,
  kind: Kind,
  opts: ResolveOpts = {}
): Promise<LeanRel | null> {
  if (!input) return null;
  const session = opts.session ?? null;
  const M = modelMap[kind];

  const found = await findByAny<{ _id?: any; slug?: string; name?: string }>(
    kind,
    input,
    session
  );
  if (found) {
    // Backfill slug if needed
    if (!found.slug && (found.name || input.name)) {
      const s = slugify(found.name ?? input.name!);
      if (opts.backfillSlug) {
        await M.updateOne(
          { _id: (found as any)._id },
          { $set: { slug: s } },
          { session: session ?? undefined }
        );
      }
      return { slug: s, name: found.name ?? input.name };
    }
    return { slug: found.slug as string, name: found.name ?? input.name };
  }

  // create only if explicitly allowed
  if (opts.allowNew && input._new) {
    const name = input.name ?? input.slug ?? "Untitled";
    const slug = input.slug ?? slugify(name);
    const created = await new M({ name, slug }).save({
      session: session ?? undefined,
    });
    return { slug: (created.toObject() as any).slug as string, name };
  }

  // Treat unknown relations as missing so callers/tests can decide what to do.
  // (Project repo already collects unresolved slugs and errors accordingly.)
  return null;
}

export async function resolveManyRelations(
  inputs: Array<RelInput | null | undefined> | undefined,
  kind: Kind,
  opts: ResolveOpts = {}
): Promise<LeanRel[]> {
  const list = (inputs ?? []).filter(
    (x) => x && (x._id || x.slug || x.name)
  ) as RelInput[];
  if (!list.length) return [];
  const out: LeanRel[] = [];
  for (const inp of list) {
    const v = await resolveOneRelation(inp, kind, opts);
    if (v) out.push(v);
  }
  return out;
}
