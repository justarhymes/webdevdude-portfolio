import { config } from "dotenv";
import fs from "node:fs";
import mongoose from "mongoose";

// Load env (prefer .env.local, fall back to .env)
if (fs.existsSync(".env.local")) {
  config({ path: ".env.local" });
} else {
  config();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const targetDb = process.env.MONGO_DB || "webdevdude";
  if (!uri) throw new Error("MONGODB_URI missing");

  // Connect to "test" (source) and your real DB (dest)
  const src = await mongoose.createConnection(uri, { dbName: "test" }).asPromise();
  const dst = await mongoose.createConnection(uri, { dbName: targetDb }).asPromise();

  // collections to migrate (adjust as needed)
  const names = ["clients", "projects", "skills", "studios", "tasks", "types"] as const;

  for (const name of names) {
    const S = src.collection(name);
    const D = dst.collection(name);

    const cursor = S.find({});
    let moved = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;

      // prefer slug for identity; else fall back to _id
      const filter = doc.slug ? { slug: doc.slug } : { _id: doc._id };
      const { _id, ...rest } = doc;

      await D.updateOne(filter, { $set: rest }, { upsert: true });
      moved++;
    }
    console.log(`✓ ${name}: upserted ${moved}`);
  }

  await src.close();
  await dst.close();
  console.log(`Done. Migrated from "test" → "${targetDb}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
