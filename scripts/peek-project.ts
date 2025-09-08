// scripts/peek-project.ts
// Run with:  npm run peek:project        (see package.json)

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd()); // <-- loads .env.local, .env, etc

import { connectToDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { resolveManyRelations, resolveOneRelation } from "@/repositories/relationResolvers";

type Argv = { limit?: number; slug?: string };

function parseArgv(): Argv {
  const out: Argv = {};
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split("=");
    if (k === "--limit") out.limit = Number(v || "10");
    if (k === "--slug") out.slug = v;
  }
  return out;
}

function short(v: unknown, max = 140) {
  const s = JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + " …" : s;
}

async function main() {
  const { limit = 10, slug } = parseArgv();

  // Helpful assertion so we fail fast with a clear message
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI. Put it in .env.local (or .env), or prefix the command with MONGODB_URI=..."
    );
  }

  await connectToDB();

  const filter = slug ? { slug } : {};
  const docs = await Project.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();

  if (!docs.length) {
    console.log("No projects found for filter:", filter);
    return;
  }

  for (const doc of docs) {
    const id = `${(doc as any).slug ?? (doc as any)._id}`;
    console.log("\n────────────────────────────────────────────────────────");
    console.log(`Project: ${id}`);
    console.log("title:", (doc as any).title);

    console.log("RAW.skills:", short((doc as any).skills));
    console.log("RAW.type:", short((doc as any).type));
    console.log("RAW.client:", short((doc as any).client));
    console.log("RAW.studio:", short((doc as any).studio));

    const [skills, typeRel, clientRel, studioRel] = await Promise.all([
      resolveManyRelations((doc as any).skills, "skill"),
      resolveOneRelation((doc as any).type, "type"),
      resolveOneRelation((doc as any).client, "client"),
      resolveOneRelation((doc as any).studio, "studio"),
    ]);

    console.log("RES.skills:", short(skills));
    console.log("RES.type:", short(typeRel));
    console.log("RES.client:", short(clientRel));
    console.log("RES.studio:", short(studioRel));

    const rawEmptySkills =
      Array.isArray((doc as any).skills) &&
      (doc as any).skills.some((s: any) => !s || (!s._id && !s.slug && !s.name));
    const rawEmptyType = (doc as any).type && !(doc as any).type._id && !(doc as any).type.slug && !(doc as any).type.name;
    const rawEmptyClient = (doc as any).client && !(doc as any).client._id && !(doc as any).client.slug && !(doc as any).client.name;
    const rawEmptyStudio = (doc as any).studio && !(doc as any).studio._id && !(doc as any).studio.slug && !(doc as any).studio.name;

    console.log("VERDICT.skills_has_empty_shells:", !!rawEmptySkills);
    console.log("VERDICT.type_empty_shell:", !!rawEmptyType);
    console.log("VERDICT.client_empty_shell:", !!rawEmptyClient);
    console.log("VERDICT.studio_empty_shell:", !!rawEmptyStudio);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
