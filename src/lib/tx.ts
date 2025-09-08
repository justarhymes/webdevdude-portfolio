import mongoose from "mongoose";

type MaybeClient = {
  topology?: { logicalSessionTimeoutMinutes?: number };
} | undefined;

export async function withOptionalTransaction<T>(
  fn: (session?: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  let session: mongoose.ClientSession | undefined;
  const wantTx = process.env.MONGO_USE_TRANSACTIONS !== "false";

  try {
    if (!wantTx) return await fn(undefined);

    try {
      session = await mongoose.startSession();
    } catch {
      return await fn(undefined);
    }

    const client = (mongoose.connection as unknown as { client?: MaybeClient })
      .client;
    const supportsSessions = !!client?.topology?.logicalSessionTimeoutMinutes;
    if (!supportsSessions) return await fn(undefined);

    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = (e as { code?: number }).code;
    if (
      code === 20 ||
      msg.includes("Transaction numbers are only allowed") ||
      msg.includes("Cannot start transaction")
    ) {
      return await fn(undefined);
    }
    throw e;
  } finally {
    if (session) await session.endSession();
  }
}
