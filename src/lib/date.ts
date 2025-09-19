// src/lib/date.ts
/**
 * Formats resume-style date ranges.
 * Accepts ISO-ish "YYYY-MM" or "YYYY" strings, and supports "Present" or current=true.
 */
export function formatResumeDates(
  start?: string,
  end?: string,
  current?: boolean
): string {
  const fmt = (s?: string) => {
    if (!s) return "";
    // keep as-is if not parseable; otherwise, format as "MMM YYYY" or "YYYY"
    // We’ll keep simple: if it contains "-", show as is; otherwise, just the string.
    // (You can swap to a richer formatter later.)
    return s;
  };

  const startStr = fmt(start);
  const endStr = current ? "Present" : fmt(end);

  if (startStr && endStr) return `${startStr} – ${endStr}`;
  if (startStr) return startStr;
  if (endStr) return endStr;
  return "";
}
