import "dotenv/config";
import fs from "node:fs/promises";
import process from "node:process";
import { connectToDB } from "@/lib/db";
import { ResumeItemInput } from "@/domain/resume";
import { createResumeItem } from "@/repositories/resumeRepository";

function getArg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const file = getArg("file");
  const jsonArg = getArg("json");
  const dryRun = !!getArg("dry-run");
  const upsert = !!getArg("upsert");
  const allowNew = !!getArg("new-ok");

  const src = file ? await fs.readFile(file, "utf8") : jsonArg;
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

  const result = await createResumeItem(parsed.data, { dryRun, upsert, allowNew });
  if (!result.ok) {
    console.error("Create failed:", result.error.message);
    process.exit(1);
  }

  if (dryRun) {
    console.log("Dry run plan:", JSON.stringify(result.summary, null, 2));
  } else {
    console.log("Created/Updated:", result.data._id || "OK");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
