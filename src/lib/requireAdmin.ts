import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqualEnvToken } from "@/lib/auth";

export function requireAdmin(req: NextRequest) {
  const token = (req.headers.get("x-admin-token") || "").trim();
  if (!timingSafeEqualEnvToken(token)) {
    return NextResponse.json(
      { error: { message: "Unauthorized", issues: [] } },
      { status: 401 }
    );
  }
  return null; // authorized
}