// scripts/seed.ts
// Run with:
//   npx tsx -r tsconfig-paths/register scripts/seed.ts
//   or npm run seed

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/db";
import { Skill } from "@/models/Skill";
import { Task } from "@/models/Task";
import { Client } from "@/models/Client";
import { Studio } from "@/models/Studio";
import { Type } from "@/models/Type";
import { Project } from "@/models/Project";
import { slugify } from "@/lib/slug";

/* -------------------------------------------------------------------------- */
/*  Seed lists for base catalogs                                              */
/* -------------------------------------------------------------------------- */

const nameMaps = {
  tasks: [
    "Firebase Development",
    "Bot Development",
    "Software Development",
    "Backend Development",
    "Mobile App Development",
    "Project Management",
    "Product",
    "Branding",
    "UI/UX Design",
    "Frontend Development",
  ],
  types: ["Business", "Web App", "eCommerce", "Mobile App"],
  studios: [
    "PXL Bros",
    "Nimble Newt",
    "Reason Media",
    "Gene Goldstein",
    "Gamer Sensei",
    "Nina Boyce",
  ],
  clients: [
    "Corsair",
    "Tasty Bite",
    "Jobskie, LLC",
    "Open Road Films",
    "Fox Movies",
    "EquipZoo",
    "Los Angeles Philharmonic Association",
  ],
  skills: [
    "Gulp",
    "Git",
    "JQuery",
    "Foundation",
    "JavaScript",
    "SASS",
    "CSS",
    "HTML",
    "Design",
    "Cordova",
    "Acquia",
    "Drupal",
    "Comic Easel",
    "WordPress",
    "REST API",
    "Yarn",
    "FabricJS",
    "WebcamJS",
    "Component Design",
    "FeathersJS",
    "Node.js",
    "Redux",
    "React",
    "Ember.js",
    "AngularJS",
    "Bulma",
    "Bootstrap",
    "npm",
    "Bower",
    "Grunt",
    "Canvas",
    "Tailwind",
    "Next.js",
    "Amazon Web Services",
    "Shopify",
    "Google Cloud Platform",
    "Firebase",
    "Heroku",
    "Nuxt",
    "Vue",
    "Bedrock",
    "Sage",
    "Trellis",
    "Google Spreadsheet Scripts",
    "Gem",
    "Ruby on Rails",
    "History.js",
    "PHP",
  ],
};

// Prismic type.slug => display name fallback (we prefer slug lookups first)
const typeNameMap: Record<string, string> = {
  business: "Business",
  "web-app": "Web App",
  ecommerce: "eCommerce",
  "mobile-app": "Mobile App",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Catalog upsert with slug-or-name dedupe (prevents duplicates) */
async function upsertCatalogWithSlug(Model: mongoose.Model<any>, name: string) {
  const slug = slugify(name);
  const existing = await Model.findOne({ $or: [{ slug }, { name }] });
  if (existing) {
    const updates: Record<string, any> = {};
    if (!existing.slug) updates.slug = slug;
    if (!existing.name) updates.name = name;
    if (Object.keys(updates).length) {
      await Model.updateOne({ _id: existing._id }, { $set: updates });
    }
    return existing;
  }
  return Model.create({ name, slug });
}

async function seedList(Model: mongoose.Model<any>, names: string[]) {
  for (const name of names) await upsertCatalogWithSlug(Model, name);
}

/** For tight typing of lean() results from catalog models */
type CatalogLean = { slug?: string; name?: string };

/** Lookup by slug or name; returns plain { slug, name } or null */
async function leanRelFromCatalog(
  Model: mongoose.Model<any>,
  v: { slug?: string; name?: string } | null | undefined
): Promise<{ slug: string; name: string } | null> {
  if (!v) return null;

  if (v.slug) {
    const bySlug = await Model.findOne({ slug: v.slug })
      .select({ slug: 1, name: 1, _id: 0 })
      .lean<CatalogLean>()
      .exec();
    if (bySlug?.slug) {
      return { slug: bySlug.slug, name: bySlug.name ?? v.name ?? bySlug.slug };
    }
  }

  if (v.name) {
    const byName = await Model.findOne({ name: v.name })
      .select({ slug: 1, name: 1, _id: 0 })
      .lean<CatalogLean>()
      .exec();
    if (byName?.slug) {
      return { slug: byName.slug, name: byName.name ?? v.name };
    }
  }

  return null;
}

/** Build clean $set/$unset so we never store undefined */
function buildSetAndUnset(obj: Record<string, any>) {
  const $set: Record<string, any> = {};
  const $unset: Record<string, "" | 1> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v === null) $unset[k] = "";
    else $set[k] = v;
  }
  return { $set, $unset };
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  const conn = await connectToDB();
  console.log(`✅ Connected to db="${conn.connection.name}"`);

  // 1) Seed base catalogs (slug-or-name deduped)
  await seedList(Task, nameMaps.tasks);
  await seedList(Type, nameMaps.types);
  await seedList(Studio, nameMaps.studios);
  await seedList(Client, nameMaps.clients);
  await seedList(Skill, nameMaps.skills);
  console.log("✅ Seeded base catalogs");

  // 2) Load prismic export
  const filePath = path.resolve("scripts/project-data.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data: any[] = JSON.parse(raw);

  // 3) Upsert projects by slug (update in place; no duplicates)
  for (const item of data) {
    const title = item?.data?.title?.[0]?.text || "Untitled";
    const slug = item?.slugs?.[0] || slugify(title);

    // TYPE: prefer slug, fallback to mapped display name
    const typeSlug: string | undefined = item?.data?.type?.slug;
    const typeRel =
      (await leanRelFromCatalog(Type, { slug: typeSlug })) ||
      (await leanRelFromCatalog(Type, {
        name: typeSlug ? typeNameMap[typeSlug] : undefined,
      }));

    // CLIENT / STUDIO
    const clientRel = await leanRelFromCatalog(Client, {
      slug: item?.data?.client?.slug,
    });
    const studioRel = await leanRelFromCatalog(Studio, {
      slug: item?.data?.studio?.slug,
    });

    // LINKS
    const primaryLink = item?.data?.website_link?.url || null;
    const secondaryLink = item?.data?.secondary_link?.url || null;

    // MEDIA
    const abbr = (item?.data?.abbreviation || "").toLowerCase();
    const galleryCount: number = item?.data?.gallery_count ?? 0;
    const thumb = abbr ? `${abbr}/thumb.jpg` : null;
    const media =
      abbr && galleryCount > 0
        ? Array.from(
            { length: galleryCount },
            (_, i) => `${abbr}/page${pad2(i + 1)}.jpg`
          )
        : [];

    // SKILLS (array of slugs from prismic)
    const prismicSkills: string[] =
      (item?.data?.project_skills || [])
        .map((it: any) => it?.skills?.slug)
        .filter((s: any) => typeof s === "string" && !!s) ?? [];

    const skillsRels = (
      await Promise.all(
        prismicSkills.map((sk) => leanRelFromCatalog(Skill, { slug: sk }))
      )
    ).filter(Boolean) as { slug: string; name: string }[];

    // TASKS (array of slugs from prismic)
    const prismicTaskSlugs: string[] =
      (item?.data?.project_tasks || [])
        .map((it: any) => it?.tasks?.slug)
        .filter((s: any) => typeof s === "string" && !!s) ?? [];

    const tasksRels = (
      await Promise.all(
        prismicTaskSlugs.map((tk) => leanRelFromCatalog(Task, { slug: tk }))
      )
    ).filter(Boolean) as { slug: string; name: string }[];

    // Final normalized payload
    const payload = {
      slug,
      title,
      description: item?.data?.description?.[0]?.text || "",
      year: item?.data?.year || "",
      abbreviation: abbr || undefined, // skipped if undefined
      primaryLink,
      secondaryLink,
      type: typeRel ?? null, // unset if null
      client: clientRel ?? null,
      studio: studioRel ?? null,
      skills: skillsRels, // [] ok
      tasks: tasksRels, // ✅ store as [{slug,name}]
      media,
      thumb, // null => unset
      published: true,
    };

    const update = buildSetAndUnset(payload);

    const project = await Project.findOneAndUpdate({ slug }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    console.log(
      `🛠️  Seeded project: ${
        project.title
      } • type=${!!typeRel} • client=${!!clientRel} • studio=${!!studioRel} • skills=${
        skillsRels.length
      } • tasks=${tasksRels.length} • media=${media.length}`
    );
  }

  await mongoose.disconnect();
  console.log("✅ Seeding complete");
}

main().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
