import { z } from "zod";

export type PublicIssue = Readonly<{
  path: ReadonlyArray<string | number>;
  message: string;
  code?: string;
}>;
export type ParseError = Readonly<{
  message: string;
  issues: ReadonlyArray<PublicIssue>;
}>;
type ParseResult<T> = { ok: true, data: T } | { ok: false; error: ParseError };

// convert zod's internal error to be app-friendly
export function toPublicIssues(err: unknown): PublicIssue[] {
  if (typeof err !== "object" || err === null) return [];
  const issues = (err as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) return [];

  return issues.map((raw): PublicIssue => {
    const obj = raw as { path?: unknown; message?: unknown; code?: unknown };
    const path = Array.isArray(obj.path)
      ? (obj.path as Array<string | number>)
      : [];
    const message =
      typeof obj.message === "string" ? obj.message : "Invalid value";
    const code = typeof obj.code === "string" ? obj.code : undefined;
    return { path, message, code };
  });
}

export function parseQuery<T extends z.ZodType>(
  schema: T,
  url: string
): ParseResult<z.infer<T>> {
  const { searchParams } = new URL(url);

  const query: Record<string, string | string[]> = {};
  for (const key of Array.from(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length > 1 ? values : (values[0] ?? "");
  }

  const result = schema.safeParse(query);
  if (!result.success) {
    return {
      ok: false,
      error: {
        message: result.error.message,
        issues: toPublicIssues(result.error),
      },
    };
  }
  return { ok: true, data: result.data as z.infer<T> };
}