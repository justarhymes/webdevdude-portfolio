import crypto from "node:crypto";

export function timingSafeEqualEnvToken(headerValue: string | null | undefined, envName = "ADMIN_TOKEN"): boolean {
  const expected = process.env[envName];
  if (!expected || !headerValue) return false;

  // constant-time compare
  try {
    const a = Buffer.from(headerValue);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}