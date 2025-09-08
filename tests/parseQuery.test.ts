import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseQuery } from "@/lib/parse";

const Schema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

describe("parseQuery", () => {
  it("parses valid query params", () => {
    const url = "http://x/api?q=foo&page=2";
    const res = parseQuery(Schema, url);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.q).toBe("foo");
      expect(res.data.page).toBe(2);
    }
  });

  it("returns error for invalid numbers", () => {
    const url = "http://x/api?page=0";
    const res = parseQuery(Schema, url);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toBeTruthy();
      expect(Array.isArray(res.error.issues)).toBe(true);
      expect(res.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("defaults when missing", () => {
    const url = "http://x/api";
    const res = parseQuery(Schema, url);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.page).toBe(1);
  });
});
