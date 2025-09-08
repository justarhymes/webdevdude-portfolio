import { NextRequest } from "next/server";

export const makeNextRequest = (url: string, init?: RequestInit) =>
  new NextRequest(new URL(url), init as any);