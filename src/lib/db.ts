// src/lib/db.ts
import mongoose, { ConnectOptions } from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// augment global to hold a singleton cache across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __mongoose__: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongoose__ ?? { conn: null, promise: null };
if (!global.__mongoose__) global.__mongoose__ = cache;

export async function connectToDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  // READ ENVS *NOW* (post-dotenv)
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB;

  if (!uri) {
    throw new Error("Missing MONGODB_URI in env (check .env.local or your preload)");
  }

  const opts: ConnectOptions = {};
  if (dbName) opts.dbName = dbName;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, opts).then((m) => {
      if (process.env.DEBUG_DB === "1") {
        console.log("[db] connected", { host: m.connection.host, db: m.connection.name });
      }
      return m;
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectFromDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
