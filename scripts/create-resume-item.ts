// scripts/create-resume-item.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { connectToDB } from "@/lib/db";
import { ResumeItemInput } from "@/domain/resume";
import { createResumeItem } from "@/repositories/resumeRepository";

function getArg(name: string): string | undefined {
  const prefix = `--${name}`;
  for (let i = 0; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === prefix) {
      const v = process.argv[i + 1];
      if (v && !v.startsWith("--")) return v; // --name value
      return undefined;
    }
    if (a.startsWith(prefix + "=")) {
      return a.slice(prefix.length + 1); // --name=value
    }
  }
  return undefined;
}
function hasFlag(name: string): boolean {
  const prefix = `--${name}`;
  return process.argv.some((a) => a === prefix || a.startsWith(prefix + "="));
}
function printHelp() {
  console.log(`
Create a resume item (validated by ResumeItemInput)

Usage:
  npm run create:resume -- --file=./scripts/examples/resume-experience.json [--dry-run] [--upsert] [--new-ok]
  npm run create:resume -- --json='{"section":"experience", ...}' [--dry-run] [--upsert] [--new-ok]

Flags:
  --file     Path to a JSON file (mutually exclusive with --json)
  --json     Inline JSON payload as a string
  --dry-run  Validate and resolve relations; print plan but do not write
  --upsert   Allow updating an existing item (repository decides match keys)
  --new-ok   Allow creating new skills (and backfilling their slugs)
  --help     Show this help
`);
}

async function main() {
  if (hasFlag("help")) {
    printHelp();
    process.exit(0);
  }

  const file = getArg("file");
  const jsonArg = getArg("json");
  const dryRun = hasFlag("dry-run");
  const upsert = hasFlag("upsert");
  const allowNew = hasFlag("new-ok");

  const src = file ? await fs.readFile(path.resolve(file), "utf8") : jsonArg;
  if (!src) throw new Error("Provide --file=path.json or --json='{\"...\"}'");

  const payload = JSON.parse(src);
  const parsed = ResumeItemInput.safeParse(payload);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.message);
    for (const issue of parsed.error.issues) {
      console.error(" -", issue.path.join("."), "→", issue.message);
    }
    process.exit(1);
  }

  await connectToDB();

  const result = await createResumeItem(parsed.data, {
    dryRun,
    upsert,
    allowNew,
  });
  if (!result.ok) {
    console.error("Create failed:", result.error.message);
    process.exit(1);
  }

  if (dryRun) {
    console.log("Dry run plan:", JSON.stringify(result.summary, null, 2));
  } else {
    console.log("Created/Updated:", result.data._id || "OK");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
