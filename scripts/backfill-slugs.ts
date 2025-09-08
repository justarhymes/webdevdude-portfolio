import { config } from "dotenv";
import fs from "node:fs";
import mongoose from "mongoose";
import { Skill } from "@/models/Skill";
import { Type } from "@/models/Type";
import { Client } from "@/models/Client";
import { Studio } from "@/models/Studio";
import { Project } from "@/models/Project";
import { slugify } from "@/lib/slug";

// Load env
if (fs.existsSync(".env.local")) config({ path: ".env.local" }); else config();

type ModelLike = typeof Skill | typeof Type | typeof Client | typeof Studio;

async function uniqueSlug(Model: ModelLike, base: string): Promise<string> {
  let s = base || "item";
  let i = 1;
  while (await Model.exists({ slug: s })) {
    s = `${base}-${++i}`;
  }
  return s;
}

async function backfillCollection(Model: ModelLike, label: string) {
  const cursor = Model.find({ $or: [{ slug: { $exists: false } }, { slug: "" }] }).cursor();
  let updated = 0;
  for await (const doc of cursor) {
    const name: string = (doc as any).name || "";
    const base = slugify(name || String((doc as any)._id));
    const slug = await uniqueSlug(Model, base);
    await Model.updateOne({ _id: (doc as any)._id }, { $set: { slug } });
    updated++;
  }
  console.log(`✓ ${label}: backfilled ${updated} slugs`);
}

async function backfillProjects() {
  const docs = await Project.find({}).lean();
  let touched = 0;

  for (const p of docs) {
    let change = false;
    const set: any = {};

    // helpers: look up catalog by name to get canonical slug if available
    const pick = async (Model: ModelLike, rel?: { slug?: string; name?: string } | null) => {
      if (!rel) return rel;
      if (rel.slug) return rel; // already has slug
      const byName = rel.name ? await Model.findOne({ name: rel.name }).lean<{ slug?: string } | null>() : null;
      return { ...rel, slug: byName?.slug ?? (rel.name ? slugify(rel.name) : undefined) };
    };

    const skills = Array.isArray(p.skills) ? p.skills : [];
    const newSkills = [];
    for (const s of skills) newSkills.push(await pick(Skill, s as any));
    if (JSON.stringify(newSkills) !== JSON.stringify(skills)) { set.skills = newSkills; change = true; }

    const type = await pick(Type, (p as any).type);
    if (JSON.stringify(type) !== JSON.stringify((p as any).type)) { set.type = type; change = true; }

    const client = await pick(Client, (p as any).client);
    if (JSON.stringify(client) !== JSON.stringify((p as any).client)) { set.client = client; change = true; }

    const studio = await pick(Studio, (p as any).studio);
    if (JSON.stringify(studio) !== JSON.stringify((p as any).studio)) { set.studio = studio; change = true; }

    if (change) {
      await Project.updateOne({ _id: (p as any)._id }, { $set: set });
      touched++;
    }
  }
  console.log(`✓ projects: updated ${touched} docs with relation slugs`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB;
  if (!uri) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(uri, { dbName });
  console.log(`Connected to ${dbName}`);

  await backfillCollection(Skill, "skills");
  await backfillCollection(Type, "types");
  await backfillCollection(Client, "clients");
  await backfillCollection(Studio, "studios");
  await backfillProjects();

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
