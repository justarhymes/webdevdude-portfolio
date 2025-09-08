import mongoose, { type Mongoose, type ConnectOptions } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const dbName = process.env.MONGO_DB || undefined;

type MongooseCache = { conn: Mongoose | null; promise: Promise<Mongoose> | null };
const g = globalThis as unknown as { _mongooseCache?: MongooseCache };
const cached: MongooseCache = g._mongooseCache ?? { conn: null, promise: null };
g._mongooseCache = cached;

export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const options: ConnectOptions = { dbName };
    cached.promise = mongoose.connect(MONGODB_URI, options);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
