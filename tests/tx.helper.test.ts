// uses the global Mongo setup from tests/setup/mongo.ts
import { describe, it, beforeAll, expect } from "vitest";
import mongoose from "mongoose";
import { withOptionalTransaction } from "@/lib/tx";

beforeAll(() => {
  process.env.MONGO_USE_TRANSACTIONS = "false";
});

describe("withOptionalTransaction", () => {
  it("executes the body without session when transactions disabled", async () => {
    let called = 0;

    await withOptionalTransaction(async (session) => {
      called++;
      expect(session == null).toBe(true);

      // Global test DB connection is already open (tests/setup/mongo.ts)
      await mongoose.connection.db!.collection("pings").insertOne({ ok: 1 });
    });

    expect(called).toBe(1);

    const count = await mongoose.connection
      .db!.collection("pings")
      .countDocuments();
    expect(count).toBe(1);
  });
});