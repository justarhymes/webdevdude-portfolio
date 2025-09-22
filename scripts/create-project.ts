// scripts/create-project.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { connectToDB } from "@/lib/db";
import { ProjectInput } from "@/domain/project";
import { createProject } from "@/repositories/projectRepository";

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
Create or upsert projects (validated by ProjectInput)

Usage:
  npm run create:project -- --file=./scripts/examples/project-example.json [--dry-run] [--upsert] [--new-ok]
  npm run create:project -- --file=./scripts/examples/projects-batch.json [--dry-run] [--upsert] [--new-ok]
  npm run create:project -- --json='{"title":"...", "slug":"...", ...}' [--dry-run] [--upsert] [--new-ok]

Flags:
  --file     Path to a JSON file (object or array). Mutually exclusive with --json
  --json     Inline JSON payload as a string (object or array)
  --dry-run  Validate and resolve relations; print plan(s) but do not write
  --upsert   Update when a project with the same slug exists (default: create-only)
  --new-ok   Allow creating missing relations (skills/tasks/type/client/studio) if input includes {_new:true}
  --help     Show this help

Notes:
  - Relations can be { "slug": "react" } or { "name": "React", "_new": true } when --new-ok is set.
  - The repository upserts by slug when --upsert is used.
`);
}

async function readSrc(): Promise<unknown> {
  const file = getArg("file");
  const jsonArg = getArg("json");
  const src = file ? await fs.readFile(path.resolve(file), "utf8") : jsonArg;
  if (!src) throw new Error("Provide --file=path.json or --json='{\"...\"}'");
  return JSON.parse(src);
}

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

async function main() {
  if (hasFlag("help")) {
    printHelp();
    process.exit(0);
  }

  const dryRun = hasFlag("dry-run");
  const upsert = hasFlag("upsert");
  const allowNew = hasFlag("new-ok");

  const raw = await readSrc();
  const list = toArray(raw);

  // Validate each entry against ProjectInput
  const parsedItems: Array<ReturnType<typeof ProjectInput.parse>> = [];
  const errors: string[] = [];

  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    const parsed = ProjectInput.safeParse(v);
    if (!parsed.success) {
      errors.push(
        `Item[${i}] invalid: ` +
          parsed.error.issues
            .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
            .join("; ")
      );
    } else {
      parsedItems.push(parsed.data);
    }
  }

  if (errors.length) {
    console.error("Validation failed:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  await connectToDB();

  let okCount = 0;
  for (const item of parsedItems) {
    const res = await createProject(item, { dryRun, upsert, allowNew });
    if (!res.ok) {
      console.error(`✖ ${item.slug}: ${res.error.message}`);
      process.exitCode = 1;
      continue;
    }
    if (dryRun) {
      console.log(`• ${item.slug} (dry-run)`);
      console.log(JSON.stringify(res.summary, null, 2));
    } else {
      console.log(`✓ ${item.slug} created/updated`);
    }
    okCount++;
  }

  if (okCount === parsedItems.length && process.exitCode !== 1) {
    process.exit(0);
  } else {
    process.exit(process.exitCode ?? 1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
