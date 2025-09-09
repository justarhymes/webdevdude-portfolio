import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  // For connectToDB
  process.env.MONGODB_URI = uri;
  process.env.MONGO_DB = "vitest";

  // Open a single shared connection for the whole test run
  await mongoose.connect(uri, { dbName: "vitest" });
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
